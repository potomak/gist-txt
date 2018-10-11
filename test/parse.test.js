import parse from "../src/parse"

describe("parse", () => {
  test("parses the gist id", () => {
    expect(parse("#gist-id")).toContain("gist-id")
  })

  test("returns 'index' as the default scene", () => {
    expect(parse("#gist-id")).toContain("index")
  })

  test("returns 'index' as the root scene", () => {
    expect(parse("#gist-id/")).toContain("index")
  })

  test("returns the correct scene", () => {
    expect(parse("#gist-id/foo")).toContain("foo")
  })

  test("returns the correct sub-scene", () => {
    expect(parse("#gist-id/foo/bar")).toContain("foo/bar")
  })
})
