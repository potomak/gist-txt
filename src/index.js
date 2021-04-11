//
// Gist-txt is a minimal game engine for creating text adventures and
// interactive fiction. Games created with gist-txt are stored as GitHub gists
// and hosted as HTML pages.
//
// To create a new text adventure create a new public gist at
// https://gist.github.com/ with at least one markdown file named
// `index.markdown`. This will be the game *main scene*: the starting point of
// your adventure.
//
// More info at https://github.com/potomak/gist-txt.
//
var gistId
var currentScene
var currentTrack
var files
var cache = {}
var initialized = false
window.state = {}

import mustache from "mustache"
import marked from "marked"
import esprima from "esprima"
window.esprima = esprima
import yaml from "js-yaml"
import matter from "gray-matter"

import basic from "./basic"
import components from "./components"
import httpGet from "./httpGet"
import parse from "./parse"

//
// ## Initialization
//
// During the initialization stage the fragment identifier, also called *hash*
// in the source code, in the URL is parsed to extract two pieces of
// information:
//
// 1. gist id
// 2. scene name
//
// The gist id is used to make a GET request to
// https://developer.github.com/v3/gists/#get-a-single-gist to get gist's data.
//
// When gist id is set to `DEV`, that is a conventional gist id used while
// developing adventure games, responses cache is bypassed and all requests are
// sent to `/dev`, that is a path in the local development server that maps to
// the the `./dev` directory in the local file system.
//
// A successful response triggers the loading and rendering of the selected
// scene.
//
function init() {
  cache = {}
  initialized = true
  const [gId, scene] = parse(document.location.hash)
  gistId = gId

  if (isDev()) {
    files = {}
    initUI(scene)
    return
  }

  return httpGet(`https://api.github.com/gists/${gistId}`)
    .then(JSON.parse)
    .then(gist => {
      files = gist.files
      return initUI(scene)
    })
    .catch(error => {
      components.error().innerHTML = `Error: ${error}`
      basic.show(components.error())
    })
    .finally(() => basic.hide(components.loading()))
}

//
// UI initialization consists of three steps:
//
// 1. global stylesheet application
// 2. loading and rendering of the selected scene
// 3. compilation and display of site footer
//
function initUI(scene) {
  return applyStylesheet()
    .then(loadAndRender.bind(this, scene))
    .then(compileAndDisplayFooter)
}

//
// If gist's files include `style.css` its content is applied as the global CSS
// for the story.
//
// The method returns a promise that is always resolved (the stylesheet is
// optional).
//
function applyStylesheet() {
  return getFileContent("style.css")
    .then(content => basic.appendStyle(content, {}))
    .catch(() => true)
}

//
// ## Loading and rendering scenes
//
// Every scene is associated with a Markdown file called:
//
//     `${scene}.markdown`
//
// where `scene` is the name of the scene.
//
// The `cache` object contains scene files that have been already fetched and
// compiled. If the cache doesn't contain the requested scene the *load and
// render* process includes:
//
// 1. getting the raw content of the file by sending a GET request to file's
//   `raw_url`
// 2. extracting YAML Front Matter and storing scene state in the `state` object
// 3. storing a copy of the Markdown content in the `cache` object
// 4. running a custom `init` function to initialize scene if present
// 5. rendering the Mustache content
// 6. rendering the Markdown content
// 7. writing the rendered content as the `div#content` element's inner HTML
//
// Click event listeners are added to anchors elements in the content that link
// to local resources. These custom listeners handle navigation between scenes.
//
// If everything goes well the current scene name is stored in the global
// variable `currentScene`, the previous scene's stylesheet is disabled, and the
// current scene's stylesheet is enabled.
//
function loadAndRender(scene) {
  basic.hide(components.error())
  basic.show(components.loading())

  return getScene(scene)
    .then(parsed => {
      runSceneInit(parsed)
      playTrack(parsed)
      updateGameState(parsed)
      return parsed.content
    })
    .then(renderMustache)
    .then(renderMarkdown)
    .then(outputContent)
    .then(handleInternalLinks)
    .then(basic.scrollTop)
    .then(() => {
      const currentSceneStyle = document.getElementById(sceneStyleId(currentScene))
      if (currentSceneStyle) {
        basic.disable(currentSceneStyle)
      }

      const sceneStyle = document.getElementById(sceneStyleId(scene))
      if (sceneStyle) {
        basic.enable(sceneStyle)
      }

      currentScene = scene
    })
    .catch(error => {
      components.error().innerHTML = `Error: ${error}`
      basic.show(components.error())
    })
    .finally(() => basic.hide(components.loading()))
}

//
// If the gist response is successful the footer, that includes a link to the
// original gist, is displayed.
//
function compileAndDisplayFooter() {
  const source = document.querySelector("a#source")
  source.setAttribute("href", `https://gist.github.com/${gistId}`)
  source.innerHTML = gistId
  basic.show(components.footer())
}

//
// Sends a GET request to file's `raw_url` if it's present in the `files` list.
//
function getFileContent(filename) {
  return file(filename).then(() => httpGet(fileURL(filename)))
}

//
// The YAML Front Matter is extracted from the original content. The resulting
// data is used to extend the global `state`.
//
// If data's `style` property is defined, a `<style>` tag with the content of
// the property is injected in the page HTML. A scene's `style` can be used to
// override global stylesheet rules.
//
function extractYFM(scene, content) {
  const parsed = matter(content, {
    engines: { yaml: yaml.load.bind(yaml) }
  })
  if (parsed.data.style !== undefined) {
    basic.appendStyle(parsed.data.style, { id: sceneStyleId(scene) })
  }
  return parsed
}

//
// A scene's stylesheet `<style>` element has an `id` with the form:
//
//     `${scene}-style`
//
function sceneStyleId(scene) {
  return `${scene}-style`
}

//
// Play an audio track associated to the current scene.
//
// If an audio track is already playing it fades its volume out and starts
// playing the current one's.
//
// TODO: https://github.com/potomak/gist-txt/issues/33
// Fade between tracks without jQuery (previously done using $.animate)
//
// Audio files should be included in two formats: ogg and mp3.
//
// To play a track in a scene add the `track` property to the scene's YAML Front
// Matter data and set its value to the name of the audio file without the
// extension.
//
function playTrack(parsed) {
  if (parsed.data.track !== undefined) {
    if (currentTrack !== undefined && !currentTrack.paused) {
      currentTrack.pause()
    } else {
      playSceneTrack(parsed.data.track)
    }
  }
}

//
// A helper function that creates a new `Audio` element with the `autoplay`
// and `loop` attributes set to `true` and loads an audio file based on the
// browser's audio capabilities.
//
function playSceneTrack(track) {
  // TODO: https://github.com/potomak/gist-txt/issues/34
  // Check audio support during initialization
  const ext = (new Audio().canPlayType("audio/ogg; codecs=vorbis")) ? "ogg" : "mp3"
  const filename = `${track}.${ext}`

  if (fileExists(filename)) {
    const audio = new Audio()
    audio.autoplay = true
    audio.loop = true
    audio.src = fileURL(filename)
    currentTrack = audio
  }
}

//
// Mustache content is rendered using game's global state (`window.state`) as
// its view object.
//
function renderMustache(content) {
  return mustache.render(content, window.state)
}

//
// Markdown content is rendered.
//
function renderMarkdown(content) {
  return marked(content)
}

//
// The HTML rendered content is the main content of the scene. It gets appended
// to the `#content` element in the DOM.
//
function outputContent(content) {
  components.content().innerHTML = content
}

//
// Caching content optimizes network traffic usage.
//
// The cache is implemented as a simple JavaScript object that contains gist's
// files parsed content indexed by scene name.
//
function getScene(scene) {
  if (cache[scene] !== undefined) {
    return Promise.resolve(cache[scene])
  }

  return getFileContent(`${scene}.markdown`)
    .then(extractYFM.bind(this, scene))
    .then(parsed => {
      cache[scene] = parsed
      return parsed
    })
}

//
// ## Scene navigation
//
// Internal links click events are overridden to handle navigation between
// scenes in the text adventure.
//
// `<a>` elements' `href` attribute is used to rewrite location's hash in the
// form:
//
//     `#${gistId}/${href}`
//
// At every internal link click event a new state is pushed in the
// `window.history` object to allow navigation using back and forward buttons.
//
function handleInternalLinks() {
  components.content().querySelectorAll("a").forEach(anchor => {
    const href = anchor.getAttribute("href")
    if (isExternal(href) || isAbsolute(href)) {
      return
    }

    anchor.addEventListener("click", event => {
      event.preventDefault()
      const hash = `#${gistId}/${href}`
      runScene(hash)
      window.history.pushState(null, null, document.location.pathname + hash)
    })
  })
}

function isExternal(href) {
  return href.indexOf("://") > -1
}

function isAbsolute(href) {
  return href.startsWith("/")
}

//
// Extends game state with current scene's state.
//
function updateGameState(parsed) {
  basic.extend(window.state, parsed.data.state)
}

//
// Runs a scene initialization function.
//
function runSceneInit(parsed) {
  if (parsed.data.init !== undefined) {
    parsed.data.init()
  }
}

//
// A `popstate` event is dispatched to the window every time the active history
// entry changes between two history entries for the same document.
//
// If the `files` array is undefined we need to initialize the text adventure,
// otherwise we can just render the current scene.
//
window.onpopstate = () => {
  if (!initialized) {
    return init()
  }

  if (files !== undefined) {
    runScene(document.location.hash)
  }
}

//
// ## Parsing location hash and running a scene
//
// Running a scene includes:
//
// 1. parsing location's hash to get the scene name
// 2. loading and rendering the selected scene
//
function runScene(hash) {
  const [gId, scene] = parse(hash)
  gistId = gId
  loadAndRender(scene)
}

//
// During development you can use `DEV` as special gist id.
//
// When the development environment is used, requests will be sent to the `/dev`
// path that is served by the local development server, instead of the public
// Gist API.
//
function isDev() {
  return gistId === "DEV"
}

//
// Returns a file's URL based on current environment.
//
// In the development environment `fileURL` will just return a relative path to
// the file in the `dev` directory.
//
function fileURL(filename) {
  return isDev() ? `/dev/${filename}` : files[filename].raw_url
}

//
// Returns true if a file exists in the selected gist.
//
// In the development environment it will just return `true` to avoid the need
// for an index of all development files.
//
function fileExists(filename) {
  return isDev() || files[filename] !== undefined
}

//
// Returns a promise that resolves with a `file` object if the file exists and
// rejects otherwise.
//
function file(filename) {
  if (fileExists(filename)) {
    return Promise.resolve(files[filename])
  }
  return Promise.reject("File not found")
}

//
// ## It's time to play
//
// Let's play by starting the engine as soon as the document content has been
// loaded.
//
document.addEventListener("DOMContentLoaded", init)
