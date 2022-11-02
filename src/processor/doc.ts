import path from 'path';
import { remark } from 'remark';
import { selectAll } from 'unist-util-select';
import { DocDetail } from '../proto.js';

interface Options {
  src: string;
  dist: string;
  assets?: string;
  doc: DocDetail;
  docMapping?: Map<string, DocDetail>;
}

export async function processDoc(opts: Options) {
  opts.assets = opts.assets || path.join(opts.src, 'assets');
  const { src, dist, assets, doc, docMapping } = opts;

  const content = await remark()
    .use([
      [ relativeLink, opts ],
      [ downloadImage, opts ],
    ])
    .process(doc.body);

  return content.value;
}

function relativeLink(opts: Options) {
  return tree => {
    const links = selectAll('link', tree);
    for (const node of links) {
      (node as any).url += 'xxxxx';
    }
  };
}

function downloadImage(opts: Options) {
  return async tree => {
    const imageNodes = selectAll('image', tree);
    for (const node of imageNodes) {
      (node as any).url += '_____.png';
    }
  };
}
