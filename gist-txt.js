window.onpopstate = function(event) {
  handleNewScene(document.location.hash);
};

var handleNewScene = function(hash) {
  var scene = parse(hash);
  loadAndRender(scene);
};

var handleInternalLinks = function() {
  $('a[rel=internal]').click(function(event) {
    event.preventDefault();
    var hash = '#' + gistId + $(this).attr('href');
    handleNewScene(hash);
    window.history.pushState(null, null, document.location.pathname + hash);
  });
};

var updateContentLinks = function() {
  return $.Deferred(function(defer) {
    $('#content a').attr('rel', 'internal');
    defer.resolve();
  });
};

var renderPage = function(content) {
  return $.Deferred(function(defer) {
    $('#content').html(content);
    defer.resolve();
  }).promise();
};

var getFileContent = function(scene) {
  return $.get(files[scene + '.markdown']['raw_url']);
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
  return getFileContent(scene)
    .then(render)
    .then(renderPage)
    .then(updateContentLinks)
    .then(handleInternalLinks);
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

var gistId;
var files;

$(function() {
  var scene = parse(document.location.hash);

  $.getJSON('https://api.github.com/gists/' + gistId).done(function(gist) {
    $('a#source').attr('href', 'https://gist.github.com/' + gistId).html(gistId);
    files = gist.files;
    loadAndRender(scene);
  });
});
