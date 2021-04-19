//
// Local backend
//

var path

//
// Initializes the backend using the input configuration.
//
// The initialization of the local storage backend consists just of storing the
// the value of the `path` configuration property, that is the path in the local
// development server from where content should be served.
//
function init(config) {
  path = config.path
  return Promise.resolve()
}

//
// Returns the URL of the file referenced by `filename`.
//
// The URL is a path to the file served from a local development server.
//
function fileURL(filename) {
  return Promise.resolve(`${path}/${filename}`)
}

export default {
  init,
  fileURL
}
