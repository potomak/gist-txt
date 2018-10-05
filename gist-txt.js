'use strict';

//
// Gist-txt is a minimal text adventure engine that helps game designers to
// create text adventures from GitHub gists.
//
// To create a new text adventure just create a new public gist at
// https://gist.github.com/ with at least a markdown file named
// `index.markdown`. This will be the *main scene*: the starting point of the
// adventure.
//
// Get more info at https://github.com/potomak/gist-txt.
//
var gistId;
var currentScene;
var currentTrack;
var files;
var cache = {};
var loaded = false;
window.state = {};

var VERSION = require('./package.json').version;
var mustache = require('mustache');
var marked = require('marked');
var yfm = require('yfm');
var q = require('q');

var initUI;
var applyStylesheet;
var loadAndRender;
var compileAndDisplayFooter;
var getFileContent;
var extractYFM;
var injectSceneStyle;
var cacheContent;
var renderMustache;
var renderMarkdown;
var outputContent;
var handleInternalLinks;
var playTrack;
var playSceneTrack;
var updateGameState;
var runSceneInit;
var runScene;
var parse;
var toggleError;
var toggleLoading;
var isDev;
var fileURL;
var fileExists;
var httpGet;
var extend;

//
// ## Initialization
//
// During the initialization stage the hash portion of the path get parsed to
// extract two main information:
//
// 1. gist id
// 1. scene name
//
// Using the gist id a GET request to
// https://developer.github.com/v3/gists/#get-a-single-gist is made to get
// gist's data.
//
// If gist id is set to `DEV` the `files` variable is set to an arbitrary value
// and subsequent requests will be sent to the `/dev` path.
//
// A successful response triggers the loading and rendering of the selected
// scene.
//
var init = function () {
  loaded = true;
  var scene = parse(document.location.hash);

  if (isDev()) {
    files = {};
    initUI(scene);
    return;
  }

  return httpGet('https://api.github.com/gists/' + gistId)
    .then(function (xhr) {
      return JSON.parse(xhr.responseText);
    })
    .then(function (gist) {
      files = gist.files;
      return initUI(scene);
    }, function (xhr) {
      toggleLoading(false);
      toggleError(true, xhr.statusText);
    });
};

//
// UI initialization consists of three steps:
//
// 1. global stylesheet application
// 1. loading and rendering of the selected scene
// 1. compilation and display of site footer
//
initUI = function (scene) {
  return applyStylesheet()
    .then(loadAndRender.bind(this, scene))
    .then(compileAndDisplayFooter);
};

//
// If gist's files include a `style.css` its content is used to determine the
// overall CSS style for the story.
//
// The method returns a promise that is always resolved (the stylesheet is
// optional).
//
applyStylesheet = function () {
  var deferred = q.defer();
  if (fileExists('style.css')) {
    httpGet(fileURL('style.css'))
      .then(function (xhr) {
        var style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.innerHTML = xhr.responseText;
        var head = document.querySelector('head');
        head.append(style);
      })
      .fin(deferred.resolve);
  } else {
    deferred.resolve();
  }
  return deferred.promise;
};

//
// ## Loading and rendering scenes
//
// The `cache` object is inspected to retrieve an already compiled scene file,
// otherwise the *load and render* process include:
//
// 1. getting the raw content of the file sending a GET request to file's
//   `raw_url`
// 1. extracting YAML Front Matter and stores scene state in the `state` object
// 1. storing a copy of the Markdown content in the `cache` object
// 1. running a custom `init` function to initialize scene if present
// 1. rendering the Mustache content
// 1. rendering the Markdown content
// 1. output the rendered content to the HTML `div#content` element
//
// The process continues adding `click` handlers to link in the content, to
// handle navigation between scenes.
//
// If everything goes well current scene name is associated to the global
// variable `currentScene`, then previous scene's stylesheet is disactivated and
// current scene's stylesheet is activated.
//
loadAndRender = function (scene) {
  toggleError(false);
  toggleLoading(true);

  var promise;
  if (cache[scene] !== undefined) {
    promise = q.fcall(runSceneInit.bind(this, cache[scene]));
  } else {
    promise = getFileContent(scene)
      .then(extractYFM.bind(this, scene))
      .then(cacheContent.bind(this, scene))
      .then(runSceneInit);
  }

  return promise
    .then(playTrack)
    .then(updateGameState)
    .then(renderMustache)
    .then(renderMarkdown)
    .then(outputContent)
    .then(handleInternalLinks)
    .then(function () {
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      var currentSceneStyle = document.querySelector('#' + currentScene + '-style');
      var sceneStyle = document.querySelector('#' + scene + '-style');
      if (currentSceneStyle) {
        currentSceneStyle.disabled = true;
      }
      if (sceneStyle) {
        sceneStyle.disabled = false;
      }
      currentScene = scene;
    })
    .catch(toggleError.bind(this, true))
    .fin(toggleLoading.bind(this, false));
};

//
// If the gist response is successful the footer gets compiled and displayed to
// show:
//
// * a link to the original gist
// * current version of the engine
//
compileAndDisplayFooter = function () {
  var source = document.querySelector('a#source');
  source.setAttribute('href', 'https://gist.github.com/' + gistId);
  source.innerHTML = gistId;
  document.querySelector('span#version').innerHTML = VERSION;
  document.querySelector('footer').style.display = 'block';
};

//
// Every scene is associated with a Markdown gist's file in the form:
//
//     scene + '.markdown'
//
// where `scene` is the name of the scene.
//
// A GET request to file's `raw_url` is made and if successful it resolves the
// deferred object with the result content as argument of the callback.
//
getFileContent = function (scene) {
  var deferred = q.defer();
  var filename = scene + '.markdown';

  if (!fileExists(filename)) {
    deferred.reject(new Error('Scene not found'));
    return deferred.promise;
  }

  httpGet(fileURL(filename))
    .then(function (xhr) {
      deferred.resolve(xhr.responseText);
    })
    .catch(function (xhr) {
      throw new Error(xhr.statusText);
    });

  return deferred.promise;
};

//
// The YAML Front Matter is extracted from the original content. The resulting
// context is used to extend the global `state`.
//
// If context's `style` property is defined a `<style>` tag with the content of
// the property is injected to override global stylesheet rules.
//
extractYFM = function (scene, content) {
  var parsed = yfm(content);
  if (parsed.context.style !== undefined) {
    injectSceneStyle(scene, parsed.context.style);
  }
  return parsed;
};

//
// To inject a scene's stylesheet a `<style>` element with the id attribute in
// the form:
//
//     scene + '-style'
//
// get appended into the `<head>` of the HTML document.
//
// Scene stylesheets are disabled on scene transitions and re-enabled on new
// visits of the scene.
//
injectSceneStyle = function (scene, content) {
  var style = document.createElement('style');
  style.setAttribute('id', scene + '-style');
  style.setAttribute('type', 'text/css');
  style.innerHTML = content;
  var head = document.querySelector('head');
  head.append(style);
};

//
// Play a track associated to the current scene.
//
// If there's a track already playing it fades its volume and start playing the
// current one.
//
// TODO: fade between tracks without (previously done using $.animate)
//
// Audio files should be included in two formats: ogg and mp3.
//
// To play a track in a scene add the `track` key to current scene's YAML
// header and set its value to the name of the audio file without the
// extension.
//
playTrack = function (parsed) {
  if (parsed.context.track !== undefined) {
    if (currentTrack !== undefined && !currentTrack.paused) {
      currentTrack.pause();
    } else {
      playSceneTrack(parsed.context.track);
    }
  }
  return parsed;
};

//
// An helper function that creates a new `Audio` element with the `autoplay`
// and `loop` attributes set to true and loads a file audio based on current
// browser audio capabilities.
//
playSceneTrack = function (track) {
  // TODO: check audio support during initialization
  var ext = (new Audio().canPlayType('audio/ogg; codecs=vorbis')) ? 'ogg' : 'mp3';
  var filename = track + '.' + ext;

  if (fileExists(filename)) {
    var audio = new Audio();
    audio.autoplay = true;
    audio.loop = true;
    audio.src = fileURL(filename);
    currentTrack = audio;
  }
};

//
// Mustache content is rendered using game's global state (`window.state`) as
// its view object.
//
renderMustache = function (content) {
  return mustache.render(content, window.state);
};

//
// Markdown content is rendered.
//
renderMarkdown = function (content) {
  return marked(content);
};

//
// The HTML rendered content is the main content of the scene. It gets appended
// to the `#content` element in the DOM.
//
// The returning promise fulfills after the `content` string has been inserted
// in the DOM.
//
outputContent = function (content) {
  var deferred = q.defer();
  var contentElement = document.querySelector('#content');
  contentElement.innerHTML = content;
  deferred.resolve(contentElement);
  return deferred.promise;
};

//
// Caching content prevents waste of API calls and band for slow connections.
//
// The cache consists of a simple JavaScript object that contains gist's files
// parsed content indexed by scene name.
//
cacheContent = function (scene, content) {
  cache[scene] = content;
  return content;
};

//
// ## Scene navigation
//
// Internal links click events are overridden to handle navigation between
// scenes of the text adventure.
//
// `<a>` elements' `href` attribute is used to rewrite location's hash in the
// form:
//
//     '#' + gistId + '/' + href
//
// At every internal link click event a new state get pushed in the
// `window.history` object to allow navigation using back and forward buttons.
//
handleInternalLinks = function (contentElement) {
  contentElement.querySelectorAll('a').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      event.preventDefault();
      var hash = '#' + gistId + '/' + anchor.getAttribute('href');
      runScene(hash);
      window.history.pushState(null, null, document.location.pathname + hash);
    });
  });
};

//
// Extends game state with current scene's state.
//
updateGameState = function (parsed) {
  extend(window.state, parsed.context.state);
  return parsed.content;
};

//
// Run a scene initialization function.
//
runSceneInit = function (parsed) {
  if (parsed.context.init !== undefined) {
    parsed.context.init();
  }
  return parsed;
};

//
// A `popstate` event is dispatched to the window every time the active history
// entry changes between two history entries for the same document.
//
// If the `files` array is undefined we need to initialize the text adventure,
// otherwise we can just render the current scene.
//
window.onpopstate = function () {
  if (!loaded) {
    return init();
  }

  if (files !== undefined) {
    runScene(document.location.hash);
  }
};

//
// ## Parsing location hash and running a scene
//
// Running a scene includes:
//
// 1. parsing location's hash to get scene's name
// 1. load and render selected scene
//
runScene = function (hash) {
  var scene = parse(hash);
  loadAndRender(scene);
};

//
// A gist-txt location hash has the form:
//
//     #<gist-id>/<scene>
//
// To parse the hash:
//
// 1. remove the '#' refix
// 1. split the remaining string by '/'
// 1. assign the first *segment* to the global variable `gistId`
// 1. join the remaining segments with '/'
//
// Note: gists' files can't include the '/' character in the name so, even if
// the remaining portion of the segments array is joined by '/', that array
// should always contain at most one element.
//
// If the scene name is blank return 'index', the default name of the main
// scene, otherwise return the scene name found.
//
parse = function (hash) {
  var path = hash.slice(1);
  var segments = path.split('/');
  gistId = segments.shift();
  var scene = segments.join('/');

  if (scene === '') {
    return 'index';
  }

  return scene;
};

//
// `toggleError` and `toggleLoading` help showing error and loading messages.
//
toggleError = function (display, errorMessage) {
  var element = document.querySelector('#error');
  element.innerHTML = 'Error: ' + errorMessage;
  if (display) {
    element.style.display = 'block';
  } else {
    element.style.display = 'none';
  }
};

toggleLoading = function (display) {
  var element = document.querySelector('#loading');
  if (display) {
    element.style.display = 'block';
  } else {
    element.style.display = 'none';
  }
};

//
// During development you can use the `DEV` special gist id to bypass requests
// to the local development server to the `/dev` path.
//
isDev = function () {
  return gistId === 'DEV';
};


//
// Returns a file's URL based on current environment.
//
// On development environment `fileURL` will just return a relative path to the
// file inside the `dev` directory.
//
fileURL = function (filename) {
  return isDev() ? ('/dev/' + filename) : files[filename].raw_url;
};

//
// Returns true if a file exists in the selected gist.
//
// On development environment it will just return true to avoid needing an
// index of all development files.
//
fileExists = function (filename) {
  return isDev() || files[filename] !== undefined;
};

//
// Sends a HTTP GET request to url.
//
httpGet = function (url) {
  var deferred = q.defer();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.onload = function () {
    if (xhr.status >= 200 && xhr.status < 300) {
      deferred.resolve(xhr);
    } else {
      deferred.reject(xhr);
    }
  };
  xhr.send();
  return deferred.promise;
};

//
// Extends object a with properties from object b, recursively.
//
extend = function (a, b) {
  var key;
  for (key in b) {
    if (b.hasOwnProperty(key)) {
      if (typeof a[key] === 'object' && typeof b[key] === 'object') {
        extend(a[key], b[key]);
      } else {
        a[key] = b[key];
      }
    }
  }
};

//
// ## It's time to play
//
// Let's play by starting the engine at `document.ready` event.
//
document.addEventListener('DOMContentLoaded', init);
