import rehypeSvimgProcess from '../src/rehype-svimg-process';
import visit from 'unist-util-visit';
import { processImage } from 'svimg/dist/process';
import { join } from 'path';

jest.mock('unist-util-visit', () => ({
    default: jest.fn()
}));
jest.mock('svimg/dist/process');

describe('rehypeSvimg', () => {

    beforeEach(() => {
        (visit as any as jest.Mock).mockReset();
        (processImage as jest.Mock).mockReset();
    });

    it('does nothing without img elements', async () => {
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor({
                type: 'text',
                value: '.',
                position: {
                    start: { line: 4, column: 387, offset: 668 },
                    end: { line: 4, column: 388, offset: 669 }
                }
            });
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            queue: queue as any,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).not.toHaveBeenCalled();
    });

    it('processes img elements', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            queue: queue as any,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {}
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {}
        );
    });

    it('processes img elements with explicit widths', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                width: '500'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                width: '100%'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            queue: queue as any,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                widths: [500]
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {}
        );
    });

    it('processes img elements without webp', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            webp: false,
            avif: true,
            queue: queue as any,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                webp: false,
                avif: true,
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                webp: false,
                avif: true,
            }
        );
    });

    it('processes img elements without avif', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            webp: true,
            avif: false,
            queue: queue as any,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                webp: true,
                avif: false,
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                webp: true,
                avif: false,
            }
        );
    });

    it('processes img elements without webp or avif', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            webp: false,
            avif: false,
            queue: queue as any,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                webp: false,
                avif: false,
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                webp: false,
                avif: false,
            }
        );
    });

    it('processes img elements with a configured width', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            width: 600,
            queue: queue as any,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                widths: [600]
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                widths: [600]
            }
        );
    });

    it('uses explicit widths over configured widths', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                width: '500',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                width: '100%',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node3 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-3.jpg',
                alt: 'Test layer 3',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
            visitor(node3);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            width: 600,
            queue: queue as any,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(3);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                widths: [500]
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {}
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-3.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                widths: [600]
            }
        );
    });

    it('processes img elements with explicit quality', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                quality: '85',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                quality: '100%',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            queue: queue as any,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                quality: 85,
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {}
        );
    });

    it('processes img elements with configured quality', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            queue: queue as any,
            quality: 60,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                quality: 60,
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                quality: 60,
            }
        );
    });

    it('uses explicit quality over configured quality', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-1.jpg',
                alt: 'Test layer 1',
                quality: 85,
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-2.jpg',
                alt: 'Test layer 2',
                quality: '100%',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node3 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'images/posts/2020-03-14/test-layer-3.jpg',
                alt: 'Test layer 3',
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
            visitor(node3);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            queue: queue as any,
            quality: 60,
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(3);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                quality: 85,
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
            }
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-3.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {
                quality: 60,
            }
        );
    });

    it('processes img elements with a src prefix', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'test-layer-1.jpg',
                alt: 'Test layer 1'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'test-layer-2.jpg',
                alt: 'Test layer 2'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            queue: queue as any,
            srcPrefix: 'images/posts/2020-03-14',
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {}
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {}
        );
    });

    it('processes img elements with a src prefix with trailing slash', async () => {
        const node1 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'test-layer-1.jpg',
                alt: 'Test layer 1'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const node2 = {
            type: 'element',
            tagName: 'img',
            properties: {
                src: 'test-layer-2.jpg',
                alt: 'Test layer 2'
            },
            children: [] as any,
            position: {
                start: { line: 29, column: 5, offset: 2214 },
                end: { line: 29, column: 64, offset: 2273 }
            }
        };
        const queue = { enqueue: jest.fn() };
        (visit as any as jest.Mock).mockImplementation((node: any, test: any, visitor: Function) => {
            visitor(node1);
            visitor(node2);
        });
        const tree = { tree: true };

        const transformer = rehypeSvimgProcess({
            inputDir: 'static',
            outputDir: 'static/g',
            queue: queue as any,
            srcPrefix: 'images/posts/2020-03-14/',
        });

        expect(await transformer(tree as any, {} as any)).toEqual(tree);

        expect(visit).toHaveBeenCalledWith(tree, { type: 'element', tagName: 'img' }, expect.any(Function));

        expect(processImage).toHaveBeenCalledTimes(2);
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-1.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {}
        );
        expect(processImage).toHaveBeenCalledWith(
            join('static', 'images', 'posts', '2020-03-14', 'test-layer-2.jpg'),
            join('static', 'g', 'images', 'posts', '2020-03-14'),
            queue,
            {}
        );
    });

});
