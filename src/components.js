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

export default {
  error,
  loading,
  footer,
  content
}
