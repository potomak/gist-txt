// @flow strict

//
// Backend
//

import type { Config as GistConfig } from "./gist"
import type { Config as LocalConfig } from "./local"

type Client = {
  fileURL: (string) => Promise<string>,
}

type Config = GistConfig | LocalConfig

var client: Client

import gist from "./gist"
import local from "./local"
import httpGet from "./httpGet"

//
// Initializes the backend using the input configuration.
//
// The backend client is selected depending on the storage type defined in the
// `storage` configuration property.
//
function init(config: Config): Promise<void> {
  switch (config.storage) {
    case "local":
      client = local
      return local.init(config)
    case "gist":
      client = gist
      return gist.init(config)
  }
}

//
// Returns the URL of the file referenced by `filename`.
//
function fileURL(filename: string): Promise<string> {
  return client.fileURL(filename)
}

//
// Sends a GET request to get the content of the file referenced by `filename`.
//
function fetchFileContent(filename: string): Promise<string> {
  return client.fileURL(filename).then(url => httpGet(url))
}

export default {
  init,
  fileURL,
  fetchFileContent
}
