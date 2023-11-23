# Demo Maker

_11ty-based documentation & demo pages for small projects_

---

# Installation

Inside the project you want to provide with examples, demos, documentation and
test implementation pages, create a subdirectory with its own `package.json`.
Install this library inside that directory using npm:

```shell
cd {{your-project-root}}
mkdir demo
cd demo
npm init 
npm install @gebruederheitz/demo-maker
```

Optionally define a project name that will be used in the generated site's
titles in the package.json:

```json
// {{your-project-root}}/demo/package.json
{
  // ...
  "config": {
    "projectName": "My Awesome Project"
  },
  // ...
  "scripts": {
    // Optionally define the build and serve scripts right here
    "build": "build-docs",
    "watch": "serve-docs"
  }
}
```


# Usage

This package only provides a basic layout and some configuration for the
[@11ty/eleventy](https://www.npmjs.com/package/@11ty/eleventy) static site
generator. For general documentation head to the [Eleventy Docs](https://www.11ty.dev/docs/).

## Quickstart

Create a file `index.md` at your demo root (`{{your-project-root}}/demo` if you
followed the above) with the following content:

```markdown
---
layout: basic
tags: demo
title: Home
heading: Demos & Documentation
navOrder: 1
---

Welcome to my _awesome_ project's **awesome** documentation & demo page!

```

Now build the demo site or have 11ty serve it on localhost:


```shell
npx build-docs
# or
npx watch-docs
```

Your built site can be found at `{{your-project-root}}/_demo`.

## Features

### Base Layout

Demo Maker features a simple and streamlined base layout that includes a header
and navigation bar. This allows you to skip the HTML setup and start writing
your documentation straight away. Just add `layout: basic` to your page's front
matter. Your content will be rendered to `main.container > div.content` under the
page's `<h1>`.


### Heading and Title

You should set a `title` in the front-matter of all your pages. This will be
rendered into the page's `<title>` element in the HTML's `<head>`, and appear
as the page entry's name in the navigation.

You can optionally also provide a `heading`, which will then be used instead of
the title in the page's top `<h1>` element.


### Project Name

```json
// {{your-project-root}}/demo/package.json
{
  // ...
  "config": {
    "projectName": "My Awesome Project"
  },
  // ...
}
```


### Two-Level Navigation and Navigation Sorting

Any item with the tag `demo` will receive a top-level nav entry. Its position
is determined by the value of its `navOrder` front matter entry: A lower navOrder
means a higher sort priority, i.e. the item will appear closer to the top. 
Otherwise 11ty's default sorting algorithm is used.

You can create a second level of navigation by using the parent page's slug
(i.e. the name of its directory) as another page's tag. These sub-navigation
items can also have a `navOrder`.

```
demo/
  |-- index.md
  |-- awesome-feature/
  |    |-- index.md
  |    |-- awesome-feature-faq/
  |    |     |-- index.md (tags: awesome-feature)
  |    |-- brilliant-feature-comparison/
  |    |     |-- index.md (tags: awesome-feature)
```

You can add this type of custom sorting to arbitrary collections using 
[the utility function](#utilities--custom-sorting-for-arbitrary-collections) – 
that way you can also sort the sub-navigation entries.


### Example Demonstrations (`include_demo` shortcode)

Demo Maker provides you with a shortcode you can use to demonstrate a feature
and show how it's done in one go:

```nunjucks
<!-- my-feature/index.md -->

{% include_demo 'example.html' %}
```

```html
<!-- my-feature/example.html -->
<style>
    .container {
        display: block;
        width: 2rem;
        height: 2rem;
        background-color: blue;
    }
    
    .container.modified {
        background-color: red;
    }
</style>

<div class="container" data-container="init"></div>
<script>
    const container = document.querySelector('[data-container]');
    container.addEventListener('click', () => {
        container.classList.add('modified');
    });
</script>
```

This will:
 - insert an `<h3 class="example-heading">Example</h3>`,
 - include the file `example.html` _directly_, i.e. show the user a blue square
   which will change its color when clicked,
 - include the same file inside `<pre class="language-html"><code class="language-html"></code></pre>`
   so the user can see the code that was used to generate what they're seeing,
 - insert a separator element with margin to the bottom.

You can also extend the heading by providing a custom description as the second
shortcode parameter:

```nunjucks
{% include_demo 'example.html', ' Changing the color' %}
```

Which will render:
```html
<h3 class="example-heading">Example: Changing the color</h3>
```

If the code preview should use a language other than HTML for highlighting, you
can provide a third parameter:

```nunjucks
{% include_demo 'example.html', null, 'xml' %}
```


### Custom configuration, style & script includes

Don't edit the `.eleventy.js` file; your changes will be overwritten by the next
`npm install`. Use `.eleventy.custom.js` to provide additional custom
configuration [as a regular 11ty config file](https://www.11ty.dev/docs/config/).

The main use for this is to add "passthrough copies" in order to include your
project's scripts and styles:

```js
// .eleventy.custom.js
module.exports = function (eleventyConfig) {
    // We're copying the built scripts from the main project into `_includes/assets/`
    eleventyConfig.addPassthroughCopy({
        '../modules/timer/dist/*.js': '_includes/assets',
        '../modules/timer/dist/esm/*.js': '_includes/assets/esm',
    });
    
    return {};
}
```

You can use additional front matter keys to easily include your scripts and styles
on a page:

```yaml
script: esm/timer.js
scriptDefer: true
scriptModule: true
scriptNoModule: timer.js
extraScriptAttributes: 'data-custom-attribute="test"'
stylesheet: css/timer.css
```

```html
<!-- ... -->
  <link rel="stylesheet" href="/assets/css/timer.css" />
<!-- ... -->
  <script src="/assets/esm/timer.js" type="module" defer data-custom-attribute="test"></script>
  <script nomodule src="/assets/timer.js" data-custom-attribute="test"></script>
<!-- ... -->
```

```yaml
script: timer.js
scriptDefer: true
```

```html
<!-- ... -->
  <script src="/assets/timer.js" defer></script>
<!-- ... -->
```

### Utilities & Custom sorting for arbitrary collections

Your `.eleventy.custom.js` gets called with an additional object parameter 
containing utilities (currently just the one):

```js
module.exports = function (eleventyConfig, utils) {
   // Add custom sorting by "navOrder" frontmatter attriubte to all items tagged
   // "mytagname":
   utils.sortedCollection('mycollection', 'mytagname');
}
```


### Limited content width

With a simple utility you can limit the content's width to 80ch and center it
within `<main>`:

```js
// .eleventy.custom.js
eleventyConfig.addGlobalData('contentLimited', true);
```


### Table of contents

There's a template based on the site navigation that allows you to display a
hierarchical table of contents:

```nunjucks
{% include '_includes/components/_table-of-contents.njk' %}
```

### Custom styles

The file `{{demo_root}}/_includes/assets/custom.css` will be automatically
included by the base layout.


### Favicons & Header logo

Put your favicons in `_includes/assets/icon/favicon-32.png` and `_includes/assets/icon/favicon-256.png`
to have them automatically included through the base template.

You can create a template at `_includes/components/_header-logo.njk` to add an
element containing your library's logo:

```nunjucks
{# _includes/components/_header-logo.njk #}
<a href="/" class="navbar-brand me-3 bg-light p-2 rounded rounded-circle">
   <img src="/assets/icon/favicon-256.png" width="48" height="48" alt="My logo" />
</a>
```
