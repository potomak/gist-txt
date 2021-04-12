//
// Backend
//

var client

import backendGist from "./backendGist"
import backendLocal from "./backendLocal"
import httpGet from "./httpGet"

//
// Initializes the backend using the input configuration.
//
// The backend client is selected by switching on the `storage` configuration
// property.
//
function init(config) {
  switch (config.storage) {
  case "local":
    client = backendLocal
    break
  case "gist":
    client = backendGist
    break
  }

  return client.init(config)
}

//
// Returns the URL of the file referenced by `filename`.
//
function fileURL(filename) {
  return client.fileURL(filename)
}

//
// Sends a GET request to get the content of the file referenced by `filename`.
//
function fetchFileContent(filename) {
  return client.fileURL(filename).then(url => httpGet(url))
}

export default {
  init,
  fileURL,
  fetchFileContent
}
