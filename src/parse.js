// @flow strict

//
// A gist-txt location hash has the form:
//
//     #<gist-id>/<scene>
//
// To parse the hash:
//
// 1. remove the '#' refix
// 2. split the remaining string by '/'
// 3. assign the first *segment* to the global variable `gistId`
// 4. join the remaining segments with '/'
//
// Note: gists' files can't include the '/' character in the name so, even if
// the remaining portion of the segments array is joined by '/', that array
// should always contain at most one element.
//
// If the scene name is blank return 'index', the default name of the main
// scene, otherwise return the scene name found.
//
export default function (hash: string): [string, string] {
  const path = hash.slice(1)
  const segments = path.split("/")
  const gistId = segments.shift()
  let scene = segments.join("/")

  if (scene === "") {
    scene = "index"
  }

  return [gistId, scene]
}
