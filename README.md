# gist-txt

A minimal text adventure engine.

[![Build Status](https://travis-ci.org/potomak/gist-txt.svg?branch=master)](https://travis-ci.org/potomak/gist-txt)

## Usage

Create a new public gist at https://gist.github.com/.

The gist should contain at least an `index.markdown` file used as a starting
point for your text adventure, also called the *main scene*.

See more about markdown syntax at
http://daringfireball.net/projects/markdown/syntax.

### Scenes

Every new `*.markdown` file is a *scene*.

Example: the file `city.markdown` is the *city* scene.

### Links

Links between scenes are relative links to the scene name.

Example: to make the string "go to the city" a link to the *city* scene add the
markdown code:

```markdown
[go to the city](city)
```

You can make links to the *main scene* using the `index` name, example:

```markdown
[Restart the game](index)
```

### Story state and Mustache tags

The story has a global state that could be set using YAML Front Matter blocks.

YAML Front Matter blocks are blocks of YAML at the top of each scene file. You
can alter story's state by adding an object associated to the `state` property.

Story's state can be used to change the behavior of the scene by adding Mustache
tags.

For example the scene:

```markdown
---
state:
  name: John
---

Hi {{name}}!
```

compiles to the following HTML:

```html
<p>Hi John!</p>
```

You can learn more about Mustache tags and syntax at
https://github.com/janl/mustache.js.

### Custom styles

The global stylesheet is determined by the existence on the gist of a file
named `style.css`. Rules in this file get applied during the initialization of
the story before the first scene is rendered.

Scene's stylesheet are associated to the `style` property of the YAML Front
Matter of every scene. The stylesheet is enabled when the scene is active and
disabled when the scene is not active.

### Scene initialization

You can run JavaScript code at every new visit of a scene by implementing a
function associated to YAML Front Matter's `init` property.

## Hosting

Your text adventures are already hosted by default at GitHub Gist.

You can share your games by sharing a link with the format
`http://potomak.github.io/gist-txt/#<your-gist-id>`.

An example text adventure is stored in the gist `acebd8fe14942fab4e8e`
(https://gist.github.com/potomak/acebd8fe14942fab4e8e) and could be shared with
a link to http://potomak.github.io/gist-txt/#acebd8fe14942fab4e8e

## Documentation

You can find the documentation at
http://potomak.github.io/gist-txt/docs/gist-txt.html.

Generate documentation for the project by running:

```sh
npm run doc
```

## Testing

There is a suite of tests you can execute by running:

```sh
npm test
```

## Type checker

This project uses Flow for type checking the JS source code.

You can run:

```sh
npm run flow
```

to verify that types check.

## Linting

Run:

```
npm run lint
```

## Building the bundle

Run:

```sh
npm run build
```

to build a minimized bundle that contains the game engine all its dependencies.

### Development

During development you want to be able to debug your code and continuously
rebuild the bundle after any change to your code.

Run:

```sh
npm run watch
```

to build a development version of the bundle that includes source maps and to
automatically rebuild the bundle on code changes.

#### HTTP server

Run the HTTP server:

```sh
npm run serve
```

and open http://localhost:8080.

## Story development environment

If you want to develop your text adventure locally, you can use the special
`DEV` gist id to tell the tool to search for project files inside the
`/dist/dev` directory instead of making external HTTP requests.

## Acknowledgements

This project has been inspired by [Twine](http://twinery.org/) and
[bl.ocks.org](http://bl.ocks.org/).
