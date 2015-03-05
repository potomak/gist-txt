# gist-txt

A minimal text adventure engine.

This project has been inspired by [Twine](http://twinery.org/) and
[bl.ocks.org](http://bl.ocks.org/).

## Usage

Create a new public gist at https://gist.github.com/.

The gist should contain at least an `index.markdown` file used as a starting
point for your text adventure.

See more about markdown syntax at
http://daringfireball.net/projects/markdown/syntax.

### Scenes

Every new `*.markdown` file is a *scene*.

Example: the file `city.markdown` is the *city* scene.

### Links

Links between scenes are absolute links to the scene name.

Example: to make the string "go to the city" a link to the *city* scene add the
markdown code:

```markdown
[go to the city](/city)
```

## Hosting

Your text adventures are already hosted by default at GitHub Gist.

You can share your games by sharing a link with the format
`http://potomak.github.io/gist-txt/#<your-gist-id>`.

An example text adventure is stored in the gist `acebd8fe14942fab4e8e`
(https://gist.github.com/potomak/acebd8fe14942fab4e8e) and could be shared with
a link to http://potomak.github.io/gist-txt/#acebd8fe14942fab4e8e
