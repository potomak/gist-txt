jest.mock("../src/httpGet")

// Register init to DOMContentLoaded event
require("../src/index")

const resetEnv = () => {
  // Set up our document head
  document.head.innerHTML = ""
  // Set up our document body
  document.body.innerHTML =
    "<div id=\"error\"></div>\n" +
    "<div id=\"loading\">Loading...</div>\n" +
    "<div id=\"content\"></div>\n" +
    "<footer style=\"display: none\">\n" +
    "  Source: <a id=\"source\"></a>\n" +
    "  by <a rel=\"author\"></a>\n" +
    "</footer>"

  // Reset document.location.hash
  document.location.hash = ""

  // Reset game state
  window.state = {}
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

  test("applies the scene stylesheet when the 'style' attribute is present", () => {
    const gistContent = JSON.stringify({
      files: {
        "index.markdown": { raw_url: "http://gists/index.markdown" }
      }
    })
    const styleContent = "body { background-color: black; }"
    const indexContent =
      "---\n" +
      "style: '" + styleContent + "'\n" +
      "---\n\n" +
      "Once upon a time..."
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
      expect(document.querySelector("style").innerHTML).toContain(styleContent)
      expect(document.querySelector("style").id).toEqual("index-style")
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

  test("doesn't prevent default behavior of external and absolute links", () => {
    const gistContent = JSON.stringify({
      files: {
        "index.markdown": { raw_url: "http://gists/index.markdown" }
      }
    })
    const indexContent =
      "Once upon a time... " +
      "[external link](http://example.com) " +
      "[absolute link](/path)"
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
      expect(document.getElementById("content").innerHTML).toContain("Once upon a time...")

      const originalHref = document.location.href
      // Browse to an external page
      document.querySelector("a[href='http://example.com']").click()
      // Note: document.location.href doesn't change when a link is clicked, but
      // it changes when a click listener has been added to the anchor
      expect(document.location.href).toEqual(originalHref)

      // Follow absolute link
      document.querySelector("a[href='/path']").click()
      expect(document.location.href).toEqual(originalHref)
    })
  })

  test("displays a link to the credits page if credits.markdown is present", () => {
    const gistContent = JSON.stringify({
      files: {
        "index.markdown": { raw_url: "http://gists/index.markdown" },
        "credits.markdown": { raw_url: "http://gists/credits.markdown" }
      }
    })
    const indexContent = "Once upon a time..."
    const creditsContent =
      "---\n" +
      "author: John Doe\n" +
      "---\n\n" +
      "Created by John Doe"
    const httpGet = require("../src/httpGet")
    httpGet.default.mockImplementation((url) => {
      switch (url) {
      case "http://gists/index.markdown":
        return Promise.resolve(indexContent)
      case "http://gists/credits.markdown":
        return Promise.resolve(creditsContent)
      }
      return Promise.resolve(gistContent)
    })

    // Dispatch the DOMContentLoaded event
    document.dispatchEvent(new Event("DOMContentLoaded"))

    return new Promise(process.nextTick).then(() => {
      expect(document.getElementsByTagName("footer")[0].innerHTML)
        .toContain("<a rel=\"author\" href=\"credits\">John Doe</a>")

      // Open credits page
      document.querySelector("a[rel=author]").click()
    }).then(() => new Promise(process.nextTick)).then(() => {
      expect(document.getElementById("content").innerHTML)
        .toContain("Created by John Doe")
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
    }).then(() => new Promise(process.nextTick)).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("The end")
    })
  })

  test("doesn't load the same scene twice (cached content)", () => {
    const gistContent = JSON.stringify({
      files: {
        "index.markdown": { raw_url: "http://gists/index.markdown" },
        "end.markdown": { raw_url: "http://gists/end.markdown" }
      }
    })
    const indexContent = "Once upon a time... [continue...](end)"
    const endContent = "The end... [or not?](index)"
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
      expect(httpGet.default.mock.calls[httpGet.default.mock.calls.length - 1]).toEqual(["http://gists/index.markdown"])

      // Dispatch scene transition
      document.querySelector("a[href=end]").click()
    }).then(() => new Promise(process.nextTick)).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("The end")
      expect(httpGet.default.mock.calls[httpGet.default.mock.calls.length - 1]).toEqual(["http://gists/end.markdown"])

      // Dispatch scene transition
      document.querySelector("a[href=index]").click()
    }).then(() => new Promise(process.nextTick)).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("Once upon a time...")
      expect(httpGet.default.mock.calls[httpGet.default.mock.calls.length - 1]).toEqual(["http://gists/end.markdown"])
    })
  })

  test("enables and disables the correct scene styles", () => {
    const gistContent = JSON.stringify({
      files: {
        "index.markdown": { raw_url: "http://gists/index.markdown" },
        "end.markdown": { raw_url: "http://gists/end.markdown" }
      }
    })
    const indexContent =
      "---\n" +
      "style: 'body { background-color: black; }'\n" +
      "---\n\n" +
      "Once upon a time... [continue...](end)"
    const endContent =
      "---\n" +
      "style: 'body { background-color: green; }'\n" +
      "---\n\n" +
      "The end... [or not?](index)"
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
      expect(document.getElementById("end-style")).toBeNull()
      expect(document.getElementById("index-style").innerHTML).toContain("background-color: black")
      expect(document.getElementById("index-style").disabled).toEqual(false)

      // Dispatch scene transition
      document.querySelector("a[href=end]").click()
    }).then(() => new Promise(process.nextTick)).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("The end")
      expect(document.getElementById("end-style").innerHTML).toContain("background-color: green")
      expect(document.getElementById("end-style").disabled).toEqual(false)
      expect(document.getElementById("index-style").disabled).toEqual(true)

      // Dispatch scene transition
      document.querySelector("a[href=index]").click()
    }).then(() => new Promise(process.nextTick)).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("Once upon a time...")
      expect(document.getElementById("index-style").disabled).toEqual(false)
      expect(document.getElementById("end-style").disabled).toEqual(true)
    })
  })

  test("updates the game state", () => {
    const gistContent = JSON.stringify({
      files: {
        "index.markdown": { raw_url: "http://gists/index.markdown" },
        "brave-knight.markdown": { raw_url: "http://gists/brave-knight.markdown" },
        "evil-king.markdown": { raw_url: "http://gists/evil-king.markdown" },
        "end.markdown": { raw_url: "http://gists/end.markdown" }
      }
    })
    const indexContent = "Once upon a time [a brave knight](brave-knight) fought an [evil king](evil-king)..."
    const knightContent =
      "---\n" +
      "state:\n" +
      "  brave: true\n" +
      "---\n\n" +
      "You're so brave! [continue...](end)"
    const kingContent =
      "---\n" +
      "state:\n" +
      "  evil: true\n" +
      "---\n\n" +
      "You're so evil! [continue...](end)"
    const endContent =
      "{{#brave}}Everyone lived happily ever after.{{/brave}}\n" +
      "{{#evil}}No one lived happily ever after.{{/evil}}"
    const httpGet = require("../src/httpGet")
    httpGet.default.mockImplementation((url) => {
      switch (url) {
      case "http://gists/index.markdown":
        return Promise.resolve(indexContent)
      case "http://gists/brave-knight.markdown":
        return Promise.resolve(knightContent)
      case "http://gists/evil-king.markdown":
        return Promise.resolve(kingContent)
      case "http://gists/end.markdown":
        return Promise.resolve(endContent)
      }
      return Promise.resolve(gistContent)
    })

    // Dispatch the DOMContentLoaded event
    document.dispatchEvent(new Event("DOMContentLoaded"))

    return new Promise(process.nextTick).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("Once upon a time")
      expect(window.state).toEqual({})

      // Dispatch scene transition
      document.querySelector("a[href=brave-knight]").click()
    }).then(() => new Promise(process.nextTick)).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("You're so brave!")
      expect(window.state).toEqual({ brave: true })

      // Dispatch scene transition
      document.querySelector("a[href=end]").click()
    }).then(() => new Promise(process.nextTick)).then(() => {
      expect(document.getElementById("content").innerHTML).toContain("Everyone lived happily ever after")
      expect(document.getElementById("content").innerHTML).not.toContain("No one lived happily ever after")
    })
  })
})
