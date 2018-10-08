jest.mock("../src/httpGet")

// Register init to DOMContentLoaded event
require("../src/index")

const resetEnv = () => {
  // Set up our document body
  document.body.innerHTML =
    "<div id=\"error\"></div>" +
    "<div id=\"loading\">Loading...</div>" +
    "<div id=\"content\"></div>" +
    "<footer style=\"display: none\">" +
    "  Source: <a id=\"source\"></a>" +
    "</footer>"
}

describe("init", () => {
  beforeEach(resetEnv)

  test("displays an error if the gist request fails", () => {
    const httpGet = require("../src/httpGet")
    httpGet.default.mockImplementation(() => Promise.reject("Test error"))

    // Dispatch the DOMContentLoaded event
    document.dispatchEvent(new Event("DOMContentLoaded"))

    return new Promise(process.nextTick).then(() => {
      expect(document.getElementById("error").innerHTML).toEqual("Error: Test error")
      expect(document.getElementById("error").style.display).toEqual("block")
      expect(document.getElementById("loading").style.display).toEqual("none")
    })
  })

  test("displays the index scene content", () => {
    const gistContent = JSON.stringify({
      files: {
        "index.markdown": { raw_url: "http://gists/index.markdown" }
      }
    })
    const indexContent = "Once upon a time..."
    const httpGet = require("../src/httpGet")
    httpGet.default.mockImplementation((url) => {
      switch (url) {
        case "http://gists/index.markdown":
          return Promise.resolve(indexContent)
      }
      return Promise.resolve(gistContent)
    })

    // Dispatch the DOMContentLoaded event
    document.dispatchEvent(new Event("DOMContentLoaded"))

    return new Promise(process.nextTick).then(() => {
      expect(document.getElementById("error").style.display).toEqual("none")
      expect(document.getElementById("loading").style.display).toEqual("none")
      expect(document.getElementById("content").innerHTML).toContain("<p>Once upon a time...</p>")
    })
  })

  test("applies the default stylesheet when style.css is present", () => {
    const gistContent = JSON.stringify({
      files: {
        "index.markdown": { raw_url: "http://gists/index.markdown" },
        "style.css": { raw_url: "http://gists/style.css" }
      }
    })
    const indexContent = "Once upon a time..."
    const styleContent = "body { background-color: black; }"
    const httpGet = require("../src/httpGet")
    httpGet.default.mockImplementation((url) => {
      switch (url) {
        case "http://gists/index.markdown":
          return Promise.resolve(indexContent)
        case "http://gists/style.css":
          return Promise.resolve(styleContent)
      }
      return Promise.resolve(gistContent)
    })

    // Dispatch the DOMContentLoaded event
    document.dispatchEvent(new Event("DOMContentLoaded"))

    return new Promise(process.nextTick).then(() => {
      expect(document.getElementsByTagName("style")[0].innerHTML).toContain(styleContent)
    })
  })

  test("renders mustache tags", () => {
    const gistContent = JSON.stringify({
      files: {
        "index.markdown": { raw_url: "http://gists/index.markdown" }
      }
    })
    const indexContent =
      "---\n" +
      "state:\n" +
      "  hero: Bob\n" +
      "---\n\n" +
      "Once upon a time {{hero}}..."
    const httpGet = require("../src/httpGet")
    httpGet.default.mockImplementation((url) => {
      switch (url) {
        case "http://gists/index.markdown":
          return Promise.resolve(indexContent)
      }
      return Promise.resolve(gistContent)
    })

    // Dispatch the DOMContentLoaded event
    document.dispatchEvent(new Event("DOMContentLoaded"))

    return new Promise(process.nextTick).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("<p>Once upon a time Bob...</p>")
    })
  })
})

describe("scene transition", () => {
  beforeEach(resetEnv)

  test("displays the scene content", () => {
    const gistContent = JSON.stringify({
      files: {
        "index.markdown": { raw_url: "http://gists/index.markdown" },
        "end.markdown": { raw_url: "http://gists/end.markdown" }
      }
    })
    const indexContent = "Once upon a time... [continue...](end)"
    const endContent = "The end"
    const httpGet = require("../src/httpGet")
    httpGet.default.mockImplementation((url) => {
      switch (url) {
        case "http://gists/index.markdown":
          return Promise.resolve(indexContent)
        case "http://gists/end.markdown":
          return Promise.resolve(endContent)
      }
      return Promise.resolve(gistContent)
    })

    // Dispatch the DOMContentLoaded event
    document.dispatchEvent(new Event("DOMContentLoaded"))

    return new Promise(process.nextTick).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("Once upon a time...")

      // Dispatch scene transition
      document.querySelector("a[href=end]").click()
    }).then(() => {
      return new Promise(process.nextTick)
    }).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("The end")
    })
  })
})
