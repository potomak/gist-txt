//
// Cache
//
// For now the cache is implemented as a simple JavaScript object.
//

var data = {}

//
// Returns a promise that resolves with the content indexed by `key` in the
// cache or rejects in case the `key` is invalid.
//
function get(key) {
  if (data[key] === undefined) {
    return Promise.reject("Cache miss")
  }

  return Promise.resolve(data[key])
}

//
// Adds a reference `key` to `value` in the cache and returns a promise that
// trivially resolves with `value`.
//
function set(key, value) {
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
