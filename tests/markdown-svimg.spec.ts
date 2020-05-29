import markdownSvimg from '../src/markdown-svimg';
import unified from 'unified';
import globby from 'globby';
import { Queue, processImage } from 'svimg/dist/process';
import fs from 'fs';
import markdown from 'remark-parse';
import remark2rehype from 'remark-rehype';
import raw from 'rehype-raw';
import html from 'rehype-stringify';
import rehypeSvimgProcess from '../src/rehype-svimg-process';
import matter from 'gray-matter';
import { dirname, join } from 'path';

jest.mock('unified', () => ({
    default: jest.fn(),
}));
jest.mock('globby', () => ({
    default: jest.fn(),
}));
jest.mock('svimg/dist/process');
jest.mock('fs', () => ({
    default: {
        promises: {
            readFile: jest.fn(),
        }
    }
}));
jest.mock('gray-matter', () => ({
    default: jest.fn(),
}));

describe('markdownSvimg', () => {

    let enqueue: jest.Mock;
    let use: jest.Mock;
    let process: jest.Mock;
    beforeEach(() => {
        process = jest.fn();
        use = jest.fn(() => ({
            use,
            process,
        }));
        (unified as jest.Mock).mockReset();
        (unified as jest.Mock).mockReturnValue({
            use,
            process,
        });
        (globby as any as jest.Mock).mockReset();
        (Queue as jest.Mock).mockReset();
        enqueue = jest.fn();
        (Queue as jest.Mock).mockReturnValue({
            enqueue
        });
        (matter as any as jest.Mock).mockReset();
    });

    it('throws error without files', () => {
        expect(() => markdownSvimg({
            files: '',
            rehypeOptions: {
                inputDir: 'static',
                outputDir: 'static/g',
            }
        })).toThrow();
    });

    it('returns plugin properties', () => {
        expect(markdownSvimg({
            files: 'data/*.md',
            rehypeOptions: {
                inputDir: 'static',
                outputDir: 'static/g',
            }
        })).toEqual({
            name: 'markdown-svimg',
            buildEnd: expect.any(Function),
        });
    });

    it('does nothing without any globbed files', async () => {
        (globby as any as jest.Mock).mockImplementation(() => Promise.resolve([]));

        const plugin = markdownSvimg({
            files: 'data/*.md',
            rehypeOptions: {
                inputDir: 'static',
                outputDir: 'static/g',
            }
        });
        await plugin.buildEnd();
        expect(globby).toHaveBeenCalledWith('data/*.md');
        expect(enqueue).not.toHaveBeenCalled();
        expect(unified).not.toHaveBeenCalled();
    });

    it('processes globbed files', async () => {
        (globby as any as jest.Mock).mockImplementation(() => Promise.resolve([
            'data/one.md',
            'data/two.md',
        ]));
        enqueue.mockImplementationOnce(() => Promise.resolve('rawone')).mockImplementationOnce(() => Promise.resolve('rawtwo'));
        (matter as any as jest.Mock).mockReturnValueOnce({
            data: { one: true },
            content: 'one',
        }).mockReturnValueOnce({
            data: { two: true },
            content: 'two',
        });

        const plugin = markdownSvimg({
            files: 'data/*.md',
            rehypeOptions: {
                inputDir: 'static',
                outputDir: 'static/g',
            }
        });
        await plugin.buildEnd();
        expect(globby).toHaveBeenCalledWith('data/*.md');
        expect(enqueue).toHaveBeenCalledWith(fs.promises.readFile, 'data/one.md');
        expect(enqueue).toHaveBeenCalledWith(fs.promises.readFile, 'data/two.md');
        expect(matter).toHaveBeenCalledWith('rawone');
        expect(matter).toHaveBeenCalledWith('rawtwo');
        expect(unified).toHaveBeenCalled();
        expect(use).toHaveBeenCalledWith(markdown);
        expect(use).toHaveBeenCalledWith(remark2rehype);
        expect(use).toHaveBeenCalledWith(rehypeSvimgProcess, {
            inputDir: 'static',
            outputDir: 'static/g',
            queue: { enqueue }
        });
        expect(use).toHaveBeenCalledWith(html);
        expect(process).toHaveBeenCalledWith('one');
        expect(process).toHaveBeenCalledWith('two');
    });

    it('processes globbed files with raw html', async () => {
        (globby as any as jest.Mock).mockImplementation(() => Promise.resolve([
            'data/one.md',
            'data/two.md',
        ]));
        enqueue.mockImplementationOnce(() => Promise.resolve('rawone')).mockImplementationOnce(() => Promise.resolve('rawtwo'));
        (matter as any as jest.Mock).mockReturnValueOnce({
            data: { one: true },
            content: 'one',
        }).mockReturnValueOnce({
            data: { two: true },
            content: 'two',
        });

        const plugin = markdownSvimg({
            files: 'data/*.md',
            includeImg: true,
            rehypeOptions: {
                inputDir: 'static',
                outputDir: 'static/g',
            }
        });
        await plugin.buildEnd();
        expect(globby).toHaveBeenCalledWith('data/*.md');
        expect(enqueue).toHaveBeenCalledWith(fs.promises.readFile, 'data/one.md');
        expect(enqueue).toHaveBeenCalledWith(fs.promises.readFile, 'data/two.md');
        expect(matter).toHaveBeenCalledWith('rawone');
        expect(matter).toHaveBeenCalledWith('rawtwo');
        expect(unified).toHaveBeenCalled();
        expect(use).toHaveBeenCalledWith(markdown);
        expect(use).toHaveBeenCalledWith(remark2rehype, { allowDangerousHtml: true });
        expect(use).toHaveBeenCalledWith(raw);
        expect(use).toHaveBeenCalledWith(rehypeSvimgProcess, {
            inputDir: 'static',
            outputDir: 'static/g',
            queue: { enqueue }
        });
        expect(use).toHaveBeenCalledWith(html);
        expect(process).toHaveBeenCalledWith('one');
        expect(process).toHaveBeenCalledWith('two');
    });

    it('processes globbed files with options function', async () => {
        (globby as any as jest.Mock).mockImplementation(() => Promise.resolve([
            'data/one.md',
            'data/two.md',
        ]));
        enqueue.mockImplementationOnce(() => Promise.resolve('rawone')).mockImplementationOnce(() => Promise.resolve('rawtwo'));
        (matter as any as jest.Mock).mockReturnValueOnce({
            data: { one: true },
            content: 'one',
        }).mockReturnValueOnce({
            data: { two: true },
            content: 'two',
        });
        const rehypeOptions = jest.fn(({ file }) => ({
            inputDir: file,
            outputDir: dirname(file),
        }));

        const plugin = markdownSvimg({
            files: 'data/*.md',
            rehypeOptions,
        });
        await plugin.buildEnd();
        expect(globby).toHaveBeenCalledWith('data/*.md');
        expect(enqueue).toHaveBeenCalledWith(fs.promises.readFile, 'data/one.md');
        expect(enqueue).toHaveBeenCalledWith(fs.promises.readFile, 'data/two.md');
        expect(matter).toHaveBeenCalledWith('rawone');
        expect(matter).toHaveBeenCalledWith('rawtwo');
        expect(unified).toHaveBeenCalled();
        expect(use).toHaveBeenCalledWith(markdown);
        expect(use).toHaveBeenCalledWith(remark2rehype);
        expect(use).toHaveBeenCalledWith(rehypeSvimgProcess, {
            inputDir: 'data/one.md',
            outputDir: 'data',
            queue: { enqueue }
        });
        expect(use).toHaveBeenCalledWith(rehypeSvimgProcess, {
            inputDir: 'data/two.md',
            outputDir: 'data',
            queue: { enqueue }
        });
        expect(use).toHaveBeenCalledWith(html);
        expect(process).toHaveBeenCalledWith('one');
        expect(process).toHaveBeenCalledWith('two');
        expect(rehypeOptions).toHaveBeenCalledWith({ file: 'data/one.md' });
        expect(rehypeOptions).toHaveBeenCalledWith({ file: 'data/two.md' });
    });

    it('processes globbed files with front matter keys', async () => {
        (globby as any as jest.Mock).mockImplementation(() => Promise.resolve([
            'data/one.md',
            'data/two.md',
        ]));
        enqueue.mockImplementationOnce(() => Promise.resolve('rawone')).mockImplementationOnce(() => Promise.resolve('rawtwo'));
        (matter as any as jest.Mock).mockReturnValueOnce({
            data: { image: 'image1.jpg' },
            content: 'one',
        }).mockReturnValueOnce({
            data: { image2: 'image2.jpg' },
            content: 'two',
        });

        const plugin = markdownSvimg({
            files: 'data/*.md',
            frontMatterImageKeys: ['image', 'image2'],
            rehypeOptions: {
                inputDir: 'static',
                outputDir: 'static/g',
            }
        });
        await plugin.buildEnd();
        expect(globby).toHaveBeenCalledWith('data/*.md');
        expect(enqueue).toHaveBeenCalledWith(fs.promises.readFile, 'data/one.md');
        expect(enqueue).toHaveBeenCalledWith(fs.promises.readFile, 'data/two.md');
        expect(matter).toHaveBeenCalledWith('rawone');
        expect(matter).toHaveBeenCalledWith('rawtwo');
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'image1.jpg'),
            join('static', 'g'),
            { enqueue },
            {
                skipGeneration: false,
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'image2.jpg'),
            join('static', 'g'),
            { enqueue },
            {
                skipGeneration: false,
            }
        );
    });

    it('processes globbed files with front matter keys and options', async () => {
        (globby as any as jest.Mock).mockImplementation(() => Promise.resolve([
            'data/one.md',
            'data/two.md',
        ]));
        enqueue.mockImplementationOnce(() => Promise.resolve('rawone')).mockImplementationOnce(() => Promise.resolve('rawtwo'));
        (matter as any as jest.Mock).mockReturnValueOnce({
            data: { image: 'image1.jpg' },
            content: 'one',
        }).mockReturnValueOnce({
            data: { image2: 'image2.jpg' },
            content: 'two',
        });

        const plugin = markdownSvimg({
            files: 'data/*.md',
            frontMatterImageKeys: ['image', 'image2'],
            rehypeOptions: {
                inputDir: 'static',
                outputDir: 'static/g',
                webp: false,
                width: 500,
            }
        });
        await plugin.buildEnd();
        expect(globby).toHaveBeenCalledWith('data/*.md');
        expect(enqueue).toHaveBeenCalledWith(fs.promises.readFile, 'data/one.md');
        expect(enqueue).toHaveBeenCalledWith(fs.promises.readFile, 'data/two.md');
        expect(matter).toHaveBeenCalledWith('rawone');
        expect(matter).toHaveBeenCalledWith('rawtwo');
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'image1.jpg'),
            join('static', 'g'),
            { enqueue },
            {
                webp: false,
                widths: [500],
                skipGeneration: false,
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'image2.jpg'),
            join('static', 'g'),
            { enqueue },
            {
                webp: false,
                widths: [500],
                skipGeneration: false,
            }
        );
    });

});
