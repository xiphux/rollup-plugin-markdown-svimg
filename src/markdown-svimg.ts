import globby from 'globby';
import unified, { Transformer } from 'unified';
import markdown from 'remark-parse';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';
import html from 'rehype-stringify';
import fs from 'fs';
import matter from 'gray-matter';
import { ImageProcessingQueue } from 'svimg/dist/process';
import { join, dirname } from 'path';
import { Node } from 'unist';
import visit from 'unist-util-visit';

interface ImageNode {
    type: 'element';
    tagName: string;
    properties: {
        [attr: string]: string;
    },
}

// TODO: import RehypeSvimgOptions from rehype-svimg
interface RehypeSvimgOptions {
    inputDir: string;
    outputDir: string;
    webp?: boolean;
    width?: number;
}

interface RehypePluginOptions extends RehypeSvimgOptions {
    processingQueue: ImageProcessingQueue;
}

interface MarkdownSvimgOptions {
    files: string | string[];
    includeImg?: boolean;
    frontMatterImageKeys?: string[];
    rehypeOptions: RehypeSvimgOptions | ((input: { file: string }) => RehypeSvimgOptions)
}

function rehypePlugin(options: RehypePluginOptions): Transformer {

    return async function transformer(tree, file): Promise<Node> {
        const imageNodes: ImageNode[] = [];

        visit(tree, { type: 'element', tagName: 'img' }, (node: Node) => {
            imageNodes.push(node as any as ImageNode);
        });

        for (const node of imageNodes) {
            if (!(node.properties && node.properties.src)) {
                continue;
            }

            const src = node.properties.src;

            let width: number | undefined;
            if (node.properties.width) {
                if (/^[0-9]+$/.test(node.properties.width)) {
                    width = parseInt(node.properties.width, 10);
                }
            } else if (options?.width) {
                width = options.width;
            }

            await options.processingQueue.process({
                inputFile: join(options.inputDir, src),
                outputDir: join(options.outputDir, dirname(src)),
                options: {
                    webp: options.webp,
                    widths: width ? [width] : undefined,
                }
            });
        }

        return tree;
    }
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
                processor = processor.use(rehypePlugin, {
                    ...opts,
                    processingQueue
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