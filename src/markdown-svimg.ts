import globby from 'globby';
import unified from 'unified';
import markdown from 'remark-parse';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';
import rehypeSvimg from 'rehype-svimg';
import html from 'rehype-stringify';
import fs from 'fs';
import matter from 'gray-matter';
import { generateComponentAttributes, ImageProcessingQueue } from 'svimg/dist/process';
import { join, dirname } from 'path';

// TODO: import RehypeSvimgOptions from rehype-svimg
interface RehypeSvimgOptions {
    inputDir: string;
    outputDir: string;
    webp?: boolean;
    width?: number;
}

interface MarkdownSvimgOptions {
    files: string | string[];
    includeImg?: boolean;
    frontMatterImageKeys?: string[];
    rehypeOptions: RehypeSvimgOptions | ((input: { file: string }) => RehypeSvimgOptions)
}

export default function markdownSvimg(options: MarkdownSvimgOptions) {
    if (!(options?.files && options.files.length)) {
        throw new Error('Files are required');
    }

    const processingQueue = new ImageProcessingQueue();

    return {
        name: 'markdown-svimg',
        buildEnd: async () => {
            const markdownFiles = await globby(options.files);

            if (!markdownFiles.length) {
                return;
            }

            for (const file of markdownFiles) {

                const fileContent = await fs.promises.readFile(file);
                const data = matter(fileContent);

                const opts = typeof options.rehypeOptions === 'function' ? options.rehypeOptions({ file }) : options.rehypeOptions;

                let processor = unified().use(markdown);
                if (options.includeImg) {
                    processor = processor.use(remark2rehype, { allowDangerousHtml: true }).use(raw).use(html);
                } else {
                    processor = processor.use(remark2rehype).use(html);
                }
                processor = processor.use(rehypeSvimg, {
                    ...opts,
                    generateImages: true,
                });

                await processor.process(data.content);

                if (options?.frontMatterImageKeys?.length) {
                    for (const key of options.frontMatterImageKeys) {
                        const image = data.data[key];
                        if (image) {
                            await processingQueue.process({
                                inputFile: join(opts.inputDir, image),
                                outputDir: join(opts.outputDir, dirname(image)),
                                options: {
                                    webp: opts.webp,
                                    widths: opts && opts.width ? [opts.width] : undefined,
                                    skipGeneration: false,
                                }
                            });
                        }
                    }
                }
            }
        }
    };
}