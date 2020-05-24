import globby from 'globby';
import unified from 'unified';
import markdown from 'remark-parse';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';
import rehypeSvimg from 'rehype-svimg';
import html from 'rehype-stringify';
import fs from 'fs';
import matter from 'gray-matter';

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
    rehypeOptions: RehypeSvimgOptions | ((input: { file: string }) => RehypeSvimgOptions)
}

export default function markdownSvimg(options: MarkdownSvimgOptions) {
    if (!(options?.files && options.files.length)) {
        throw new Error('Files are required');
    }

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
            }
        }
    };
}