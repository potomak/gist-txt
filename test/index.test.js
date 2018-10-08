jest.mock("../src/httpGet")

describe("init", () => {
  beforeEach(() => {
    // Set up our document body
    document.body.innerHTML =
      "<div id=\"error\"></div>" +
      "<div id=\"loading\">Loading...</div>" +
      "<div id=\"content\"></div>" +
      "<footer style=\"display: none\">" +
      "  Source: <a id=\"source\"></a>" +
      "</footer>"

    // Register init to DOMContentLoaded event
    require("../src/index")
  })

  test("displays an error if the gist request fails", () => {
    const httpGet = require("../src/httpGet")
    httpGet.default.mockImplementation(() => Promise.reject("Test error"))

    // Dispatch the DOMContentLoaded event
    document.dispatchEvent(new Event("DOMContentLoaded"))

    return new Promise(resolve => {
      process.nextTick(() => {
        expect(document.getElementById("error").innerHTML).toEqual("Error: Test error")
        expect(document.getElementById("error").style.display).toEqual("block")
        expect(document.getElementById("loading").style.display).toEqual("none")
        resolve()
      })
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

    return new Promise(resolve => {
      process.nextTick(() => {
        expect(document.getElementById("error").style.display).toEqual("none")
        expect(document.getElementById("loading").style.display).toEqual("none")
        expect(document.getElementById("content").innerHTML).toContain("<p>Once upon a time...</p>")
        resolve()
      })
    })
  })
})
