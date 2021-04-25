// @flow strict

//
// Cache
//
// For now the cache is implemented as a simple JavaScript object.
//

// $FlowFixMe - Unclear type
var data: { [string]: any } = {}

//
// Returns a promise that resolves with the content indexed by `key` in the
// cache or rejects in case the `key` is invalid.
//
// $FlowFixMe - Unclear type
function get(key: string): Promise<any> {
  if (data[key] === undefined) {
    return Promise.reject("Cache miss")
  }

  return Promise.resolve(data[key])
}

//
// Adds a reference `key` to `value` in the cache and returns a promise that
// trivially resolves with `value`.
//
// $FlowFixMe - Unclear type
function set(key: string, value: any): Promise<any> {
  data[key] = value

  return Promise.resolve(value)
}

//
// It invalidates the whole cache.
//
// This function is useful for resetting the cache while testing the game
// engine.
//
function invalidate() {
  data = {}
}

export default {
  get,
  set,
  invalidate
}
