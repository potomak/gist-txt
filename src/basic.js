function show(element) {
  element.style.display = "block"
}

function hide(element) {
  element.style.display = "none"
}

function enable(element) {
  element.disabled = false
}

function disable(element) {
  element.disabled = true
}

function scrollTop() {
  document.body.scrollTop = 0
  document.documentElement.scrollTop = 0
}

//
// Appends a `<style>` element with `content` in the DOM's `<head>`.
//
function appendStyle(content, attributes) {
  var style = document.createElement("style")
  var name
  for (name in attributes) {
    if (attributes.hasOwnProperty(name)) {
      style.setAttribute(name, attributes[name])
    }
  }
  style.setAttribute("type", "text/css")
  style.innerHTML = content
  var head = document.querySelector("head")
  head.append(style)
}

//
// Extends object a with properties from object b, recursively.
//
function extend(a, b) {
  var key
  for (key in b) {
    if (b.hasOwnProperty(key)) {
      if (typeof a[key] === "object" && typeof b[key] === "object") {
        extend(a[key], b[key])
      } else {
        a[key] = b[key]
      }
    }
  }
}

export default {
  show,
  hide,
  enable,
  disable,
  scrollTop,
  appendStyle,
  extend
}
