# rollup-plugin-markdown-svimg

rollup-plugin-markdown-svimg is a [rollup](https://rollupjs.org) plugin for preprocessing images in Markdown files for use with the [svimg](https://github.com/xiphux/svimg) image component. It is intended to accompany the [rehype-svimg](https://github.com/xiphux/rehype-svimg) processing plugin which handles generating the svimg component when transforming Markdown to HTML.

## Getting Started

### Installation

```bash
npm install -D rollup-plugin-markdown-svimg
```

In `rollup.config.js`, add `markdownSvimg` as a plugin. Make sure you use the same `rehypeOptions` as you do when rendering the markdown to html with [rehype-svimg](https://github.com/xiphux/rehype-svimg) to ensure everything works together.

```js
import markdownSvimg from 'rollup-plugin-markdown-svimg';

export default {
    plugins: [
        markdownSvimg({
            files: 'data/content/**/*.md',
            rehypeOptions: {
                inputDir: 'static',
                outputDir: 'static/g',
                webp: true,
                avif: true
            }
        })
    ]
};
```

If you're using [Sapper](https://sapper.svelte.dev/), you should only add to one of the plugin lists, for example `server`, to prevent double-processing the images.

```js
import markdownSvimg from 'rollup-plugin-markdown-svimg';

export default {
    client: {
        plugins: [],
    },
    server: {
        plugins: [
            markdownSvimg({
                files: 'data/content/**/*.md',
                rehypeOptions: {
                    inputDir: 'static',
                    outputDir: 'static/g',
                    webp: true,
                    avif: true
                }
            })
        ]
    }
};
```

### Dynamic Options

`rehypeOptions` can also be a function, if you want to dynamically change the rehype-svimg options for each file. It receives an object with the markdown file name as a key. For example, if you wanted to simplify your markdown to only specify an image filename and have the build process automatically determine the correct folder for that image based on the markdown file's path:

`data/content/posts/2020-01-01/first-post.md`:
```markdown
![Splash](splash.jpg)

![Avatar](avatar.jpg)
```

```js
import markdownSvimg from 'rollup-plugin-markdown-svimg';
import { dirname, join } from 'path';

export default {
    plugins: [
        markdownSvimg({
            files: 'posts/**/*.md',
            rehypeOptions: ({ file }) => ({
                inputDir: 'static',
                outputDir: 'static/g',
                webp: true,
                avif: true,
                srcPrefix: join('images', dirname(file)),
            })
        })
    ]
};
```

This example would process the image files in `static/images/posts/2020-01-01/{splash,avatar}.jpg` and output them to `static/g/images/posts/2020-01-01/{splash,avatar}.jpg` without needing to repeatedly define the `images/posts/2020-01-01/` part of the url for each image in the Markdown file.

### Front Matter

Image urls in front matter can also be processed with the `frontMatterKeys` option. Front matter image urls will also respect the srcPrefix option if specified.

```markdown
---
title: Hello
image: images/20200101/hello.jpg
---

![Splash](images/20200101/splash.jpg)
```

```js
import markdownSvimg from 'rollup-plugin-markdown-svimg';

export default {
    plugins: [
        markdownSvimg({
            files: 'data/content/**/*.md',
            rehypeOptions: {
                inputDir: 'static',
                outputDir: 'static/g',
                webp: true,
                avif: true,
                frontMatterKeys: ['image'],
            }
        })
    ]
};
```

### Configuration

#### Plugin options

| Option         | Default       |           |
| -------------- | ------------- | --------- |
| files          | *required*    | A [minimatch](https://github.com/isaacs/minimatch#usage) glob pattern or array of glob patterns for markdown files to process
| rehypeOptions  | *required*    | An object or function that returns an object of [rehype-svimg](https://github.com/xiphux/rehype-svimg/) options. The function receives one parameter, an object with a `file` property with the current markdown file path being processed.
| includeImg     | false         | Set to true to also process inline `<img>` tags in the markdown
| frontMatterKeys |         | An array of front matter keys with image urls to process

## Built With

* [unified](https://unifiedjs.com)
* [rehype](https://github.com/rehypejs/rehype)
* [svimg](https://github.com/xiphux/svimg)
* [globby](https://github.com/sindresorhus/globby)
* [gray-matter](https://github.com/jonschlinkert/gray-matter)

## Authors

* **Chris Han** - *Initial work* - [xiphux](https://github.com/xiphux)

## License

This project is licensed under the ISC License - see the [LICENSE.md](LICENSE.md) file for details
