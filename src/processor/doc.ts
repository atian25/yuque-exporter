import path from 'path';
import { remark } from 'remark';
import { selectAll } from 'unist-util-select';
import { request } from 'undici';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';

import { DocDetail } from '../proto.js';

interface Options {
  src: string;
  dist: string;
  assets?: string;
  filePath: string;
  doc: DocDetail;
  docMapping?: Map<string, DocDetail>;
}

export async function processDoc(opts: Options) {
  opts.assets = opts.assets || path.join(opts.dist, 'assets');
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
      const url = (node as any).url;
      const localPath = await download(url, opts.assets);
      (node as any).url = path.relative(path.dirname(opts.filePath), localPath);
    }
  };
}

async function download(url, dist) {
  const { body, statusCode } = await request(url, {
    headers: {
      'user-agent': 'yuque-exporter',
    },
  });

  if (statusCode !== 200) {
    return url;
  }

  const filePath = path.join(dist, new URL(url).pathname.split('/').pop());
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await pipeline(body, fs.createWriteStream(filePath));
  return filePath;
}

function getImageName(url) {
  const pathName = new URL(url).pathname;
  return pathName.split('/').pop();
}
