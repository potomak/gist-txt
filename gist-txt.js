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
var files;
var cache = {};
var state = {};

var VERSION = require('./package.json').version;
var $ = require('jquery');
var mustache = require('mustache');
var marked = require('marked');
var yfm = require('yfm');

var compileAndDisplayFooter;
var loadAndRender;
var getFileContent;
var extractYFM;
var cacheContent;
var renderMustache;
var renderMarkdown;
var outputContent;
var handleInternalLinks;
var runScene;
var parse;
var toggleError;
var toggleLoading;

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
// A successful response triggers the loading and rendering of the selected
// scene.
//
var init = function () {
  var scene = parse(document.location.hash);

  $.getJSON('https://api.github.com/gists/' + gistId)
    .done(function (gist) {
      files = gist.files;
      compileAndDisplayFooter();
      loadAndRender(scene);
    })
    .fail(function (jsXHR) {
      toggleLoading(false);
      toggleError(true, jsXHR.statusText);
    });
};

//
// If the gist response is successful the footer gets compiled and displayed to
// show:
//
// * a link to the original gist
// * current version of the engine
//
compileAndDisplayFooter = function () {
  $('a#source')
    .attr('href', 'https://gist.github.com/' + gistId)
    .html(gistId);
  $('span#version').html(VERSION);
  $('footer').show();
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
// 1. rendering the Mustache content
// 1. rendering the Markdown content
// 1. output the rendered content to the HTML `div#content` element
//
// The process continues adding `click` handlers to link in the content, to
// handle navigation between scenes.
//
loadAndRender = function (scene) {
  toggleError(false);
  toggleLoading(true);

  var promise;
  if (cache[scene] !== undefined) {
    promise = renderMustache(cache[scene]);
  } else {
    promise = getFileContent(scene)
      .then(extractYFM)
      .then(cacheContent.bind(this, scene))
      .then(renderMustache);
  }

  promise
    .then(renderMarkdown)
    .then(outputContent)
    .then(handleInternalLinks)
    .fail(function (errorMessage) {
      toggleError(true, errorMessage);
    })
    .always(function () {
      toggleLoading(false);
    });
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
  return $.Deferred(function (defer) {
    var file = files[scene + '.markdown'];

    if (file === undefined) {
      defer.reject('Scene not found');
      return;
    }

    $.get(file.raw_url)
      .done(defer.resolve)
      .fail(function (jsXHR) {
        defer.reject(jsXHR.statusText);
      });
  }).promise();
};

//
// The YAML Front Matter is extracted from the original content. The resulting
// context is used to extend the global `state` and a promise is fulfilled with
// the stripped content.
//
extractYFM = function (content) {
  return $.Deferred(function (defer) {
    var parsed = yfm(content);
    state = $.extend(state, parsed.context.state);
    defer.resolve(parsed.content);
  }).promise();
};

//
// Mustache content is rendered and a promise is fulfilled with the resulting
// string.
//
renderMustache = function (content) {
  return $.Deferred(function (defer) {
    defer.resolve(mustache.render(content, state));
  }).promise();
};

//
// Markdown content is rendered and a promise is fulfilled with the resulting
// string.
//
renderMarkdown = function (content) {
  return $.Deferred(function (defer) {
    defer.resolve(marked(content));
  }).promise();
};

//
// The HTML rendered content is the main content of the scene. It gets appended
// to the `#content` element in the DOM.
//
// The returning promise fulfills after the `content` string has been inserted
// in the DOM.
//
outputContent = function (content) {
  return $('#content').html(content).promise();
};

//
// Caching content prevents waste of API calls and band for slow connections.
//
// The cache is composed by a simple JavaScript object that contains gist's
// files content indexed by scene name.
//
cacheContent = function (scene, content) {
  return $.Deferred(function (defer) {
    cache[scene] = content;
    defer.resolve(content);
  }).promise();
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
  contentElement.find('a').click(function (event) {
    event.preventDefault();
    var hash = '#' + gistId + '/' + $(this).attr('href');
    runScene(hash);
    window.history.pushState(null, null, document.location.pathname + hash);
  });
};

//
// A `popstate` event is dispatched to the window every time the active history
// entry changes between two history entries for the same document.
//
// If the `files` array is undefined we need to initialize the text adventure,
// otherwise we can just render the current.
//
window.onpopstate = function () {
  if (files === undefined) {
    return init();
  }

  runScene(document.location.hash);
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
  $('#error').html('Error: ' + errorMessage).toggle(display);
};

toggleLoading = function (display) {
  $('#loading').toggle(display);
};

//
// ## It's time to play
//
// Let's play by starting the engine at `document.ready` event.
//
$(init);
