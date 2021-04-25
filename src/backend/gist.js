// @flow strict

//
// Gist backend
//

export type Config = { storage: "gist", gistId: string }

type File = { raw_url: string, ... }
type Gist = { files: { [string]: File }, ... }

var files: { [string]: File }

import httpGet from "./httpGet"

//
// Initializes the backend using the input configuration.
//
// For initializing the gist backend a request is made to the Gist API for
// fetching the content of the gist referenced by the `gistId` configuration
// property.
//
// The result is a list of files that are part of the gist, that is basically
// a git repo. The list of file objects is stored in a dictionary indexed by
// file name.
//
function init(config: Config): Promise<void> {
  return httpGet(`https://api.github.com/gists/${config.gistId}`)
    .then(JSON.parse)
    .then((gist: Gist) => { files = gist.files })
}

//
// Returns the `raw_url` property of the file referenced by `filename`.
//
function fileURL(filename: string): Promise<string> {
  return file(filename).then(file => file.raw_url)
}

//
// Returns true if a file exists in the selected gist.
//
function fileExists(filename: string): boolean {
  return files[filename] !== undefined
}

//
// Returns a promise that resolves with a `file` object if the file exists or
// rejects otherwise.
//
function file(filename: string): Promise<File> {
  if (fileExists(filename)) {
    return Promise.resolve(files[filename])
  }

  return Promise.reject("File not found")
}

export default {
  init,
  fileURL
}
