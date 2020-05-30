import { RehypeSvimgOptions } from 'rehype-svimg/dist/rehype-svimg';
import { Queue, processImage } from 'svimg/dist/process';
import { Transformer } from 'unified';
import { Node } from 'unist';
import visit from 'unist-util-visit';
import { join, dirname } from 'path';

export interface RehypeSvimgProcessOptions extends RehypeSvimgOptions {
    queue: Queue;
}

interface ImageNode {
    type: 'element';
    tagName: string;
    properties: {
        [attr: string]: string;
    },
}

export default function rehypeSvimgProcess(options: RehypeSvimgProcessOptions): Transformer {
    return async function transformer(tree, file): Promise<Node> {
        const imageNodes: ImageNode[] = [];

        visit(tree, { type: 'element', tagName: 'img' }, (node: Node) => {
            imageNodes.push(node as any as ImageNode);
        });

        if (options.srcPrefix && !options.srcPrefix.endsWith('/')) {
            options.srcPrefix += '/';
        }

        await Promise.all(imageNodes.map(async (node) => {
            if (!(node.properties && node.properties.src)) {
                return;
            }

            let src = node.properties.src;
            if (options.srcPrefix) {
                src = options.srcPrefix + src;
            }

            let width: number | undefined;
            if (node.properties.width) {
                if (/^[0-9]+$/.test(node.properties.width)) {
                    width = parseInt(node.properties.width, 10);
                }
            } else if (options?.width) {
                width = options.width;
            }

            await processImage(
                join(options.inputDir, src),
                join(options.outputDir, dirname(src)),
                options.queue,
                {
                    webp: options.webp,
                    widths: width ? [width] : undefined,
                }
            );
        }));

        return tree;
    }
}