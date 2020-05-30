import globby from 'globby';
import unified from 'unified';
import markdown from 'remark-parse';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';
import html from 'rehype-stringify';
import fs from 'fs';
import matter from 'gray-matter';
import { Queue, processImage } from 'svimg/dist/process';
import { join, dirname } from 'path';
import { RehypeSvimgOptions } from 'rehype-svimg/dist/rehype-svimg';
import rehypeSvimgProcess from './rehype-svimg-process';

interface MarkdownSvimgOptions {
    files: string | string[];
    includeImg?: boolean;
    frontMatterKeys?: string[];
    rehypeOptions: RehypeSvimgOptions | ((input: { file: string }) => RehypeSvimgOptions)
}

export default function markdownSvimg(options: MarkdownSvimgOptions) {
    if (!(options?.files && options.files.length)) {
        throw new Error('Files are required');
    }

    const queue = new Queue();

    return {
        name: 'markdown-svimg',
        buildEnd: async () => {

            const markdownFiles = await globby(options.files);

            if (!markdownFiles.length) {
                return;
            }

            await Promise.all(markdownFiles.map(async (file) => {
                const fileContent = await queue.enqueue(fs.promises.readFile, file);
                const data = matter(fileContent);

                const opts = typeof options.rehypeOptions === 'function' ? options.rehypeOptions({ file }) : options.rehypeOptions;

                let processor = unified().use(markdown);
                if (options.includeImg) {
                    processor = processor.use(remark2rehype, { allowDangerousHtml: true }).use(raw);
                } else {
                    processor = processor.use(remark2rehype);
                }
                processor = processor.use(rehypeSvimgProcess, {
                    ...opts,
                    queue,
                }).use(html);

                if (opts.srcPrefix && !opts.srcPrefix.endsWith('/')) {
                    opts.srcPrefix += '/';
                }

                const promises: Array<Promise<any>> = [
                    processor.process(data.content),
                    ...(options?.frontMatterKeys?.length ?
                        options.frontMatterKeys.map(async (key) => {
                            let image = data.data[key];

                            if (!image) {
                                return;
                            }

                            if (opts.srcPrefix) {
                                image = opts.srcPrefix + image;
                            }

                            await processImage(
                                join(opts.inputDir, image),
                                join(opts.outputDir, dirname(image)),
                                queue,
                                {
                                    webp: opts.webp,
                                    skipGeneration: false,
                                }
                            );
                        }) : [])
                ];

                await Promise.all(promises);
            }));
        }
    };
}