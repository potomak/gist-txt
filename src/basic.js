// @flow strict

function show(element: HTMLElement) {
  element.style.display = "block"
}

function hide(element: HTMLElement) {
  element.style.display = "none"
}

function enable(element: HTMLStyleElement) {
  element.disabled = false
}

function disable(element: HTMLStyleElement) {
  element.disabled = true
}

function scrollTop() {
  if (document.body == null) {
    return
  }
  document.body.scrollTop = 0
  if (document.documentElement == null) {
    return
  }
  document.documentElement.scrollTop = 0
}

//
// Appends a `<style>` element with `content` to the DOM's `<head>`.
//
function appendStyle(content: string, attributes: { [string]: string }) {
  const style = document.createElement("style")
  for (const name in attributes) {
    if (Object.prototype.hasOwnProperty.call(attributes, name)) {
      style.setAttribute(name, attributes[name])
    }
  }
  style.setAttribute("type", "text/css")
  style.innerHTML = content
  const head = document.querySelector("head")
  if (head == null) {
    return
  }
  head.append(style)
}

//
// Extends object a with properties from object b, recursively.
//
// $FlowFixMe - Unclear type
function extend(a: { [string]: any }, b: { [string]: any }) {
  for (const key in b) {
    if (Object.prototype.hasOwnProperty.call(b, key)) {
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
