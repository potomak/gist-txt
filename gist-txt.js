window.onpopstate = function(event) {
  if (typeof files === 'undefined') {
    return init();
  }

  handleNewScene(document.location.hash);
};

var handleNewScene = function(hash) {
  var scene = parse(hash);
  loadAndRender(scene);
};

var handleInternalLinks = function(contentElement) {
  contentElement.find('a').click(function(event) {
    event.preventDefault();
    var hash = '#' + gistId + '/' + $(this).attr('href');
    handleNewScene(hash);
    window.history.pushState(null, null, document.location.pathname + hash);
  });
};

var cacheContent = function(scene, contentElement) {
  return $.Deferred(function(defer) {
    cache[scene] = contentElement.html();
    defer.resolve(contentElement);
  }).promise();
};

var renderPage = function(content) {
  return $('#content').html(content).promise();
};

var getFileContent = function(scene) {
  return $.Deferred(function(defer) {
    var file = files[scene + '.markdown']

    if (typeof file === 'undefined') {
      defer.reject('Scene not found');
      return;
    }

    $.get(file.raw_url)
      .done(defer.resolve)
      .fail(function(jsXHR) {
        defer.reject(jsXHR.statusText);
      });
  }).promise();
};

var render = function(markdown) {
  return $.ajax({
    type: 'POST',
    url: 'https://api.github.com/markdown/raw',
    data: markdown,
    contentType: 'text/plain'
  });
};

var loadAndRender = function(scene) {
  toggleError(false);
  toggleLoading(true);

  var promise;
  if (typeof cache[scene] !== 'undefined') {
    promise = renderPage(cache[scene]);
  } else {
    promise = getFileContent(scene)
      .then(render)
      .then(renderPage)
      .then(cacheContent.bind(this, scene))
  }

  promise
    .then(handleInternalLinks)
    .fail(function(errorMessage) {
      toggleError(true, errorMessage);
    })
    .always(function() {
      toggleLoading(false);
    });
};

var parse = function(hash) {
  var path = hash.slice(1);
  var segments = path.split('/');
  gistId = segments.shift();
  var scene = segments.join('/');

  if (scene === '') {
    return 'index';
  }

  return scene;
};

var toggleError = function(display, errorMessage) {
  $('#error').html('Error: ' + errorMessage).toggle(display);
};

var toggleLoading = function(display) {
  $('#loading').toggle(display);
};

var init = function() {
  var scene = parse(document.location.hash);

  $.getJSON('https://api.github.com/gists/' + gistId)
    .done(function(gist) {
      $('a#source').attr('href', 'https://gist.github.com/' + gistId).html(gistId);
      $('span#version').html(VERSION);
      $('footer').show();
      files = gist.files;
      loadAndRender(scene);
    })
    .fail(function(jsXHR) {
      toggleLoading(false);
      toggleError(true, jsXHR.statusText);
    });
};

var gistId;
var files;
var cache = {};
var VERSION = '1.0.0';

// Start the engine
$(init);
