// @flow strict

function requireElement(element: ?HTMLElement): HTMLElement {
  if (element == null) {
    throw new Error("Missing required element")
  }
  return element
}

function requireAnchor(element: ?HTMLElement): HTMLAnchorElement {
  if (element instanceof HTMLAnchorElement) {
    return element
  }
  throw new Error("Element is not an anchor")
}

function error(): HTMLElement {
  return requireElement(document.getElementById("error"))
}

function loading(): HTMLElement {
  return requireElement(document.getElementById("loading"))
}

function footer(): HTMLElement {
  return requireElement(document.querySelector("footer"))
}

function content(): HTMLElement {
  return requireElement(document.getElementById("content"))
}

function sourceLink(): HTMLAnchorElement {
  return requireAnchor(document.querySelector("a#source"))
}

function creditsLink(): HTMLAnchorElement {
  return requireAnchor(document.querySelector("a[rel='author']"))
}

export default {
  error,
  loading,
  footer,
  content,
  sourceLink,
  creditsLink
}
