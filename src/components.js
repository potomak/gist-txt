function error() {
  return document.getElementById("error")
}

function loading() {
  return document.getElementById("loading")
}

function footer() {
  return document.querySelector("footer")
}

function content() {
  return document.getElementById("content")
}

function sourceLink() {
  return document.querySelector("a#source")
}

function creditsLink() {
  return document.querySelector("a[rel='author']")
}

export default {
  error,
  loading,
  footer,
  content,
  sourceLink,
  creditsLink
}
