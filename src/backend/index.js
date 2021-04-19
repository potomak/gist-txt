//
// Backend
//

var client

import gist from "./gist"
import local from "./local"
import httpGet from "./httpGet"

//
// Initializes the backend using the input configuration.
//
// The backend client is selected depending on the storage type defined in the
// `storage` configuration property.
//
function init(config) {
  client = loadClient(config.storage)
  return client.init(config)
}

function loadClient(storageType) {
  switch (storageType) {
  case "local":
    return local
  case "gist":
    return gist
  }
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
