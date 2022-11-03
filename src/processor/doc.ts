import path from 'path';
import fs from 'fs';

import { remark } from 'remark';
import { selectAll } from 'unist-util-select';
import { request } from 'undici';
import { pipeline } from 'stream/promises';

import { DocDetail, TreeNode } from '../types.js';
import { config } from '../config.js';
import { readJSON } from '../utils.js';
const { host, metaDir } = config;
const hostname = new URL(host).hostname;

interface Options {
  doc: TreeNode;
  mapping: Record<string, DocDetail>;
  // src: string;
  // dist: string;
  // assets?: string;
  // filePath: string;
  // doc: DocDetail;
  // docMapping?: Map<string, DocDetail>;
}

export async function buildDoc(doc: TreeNode, mapping: Record<string, TreeNode>) {
  const docDetail = await readJSON(path.join(metaDir, doc.namespace, 'docs', `${doc.url}.json`));
  doc.content = await remark()
    .use([
      [ relativeLink, { doc, mapping }],
      // [ downloadImage, { doc, mapping }],
    ])
    .process(docDetail.body)
    .then(f => f.toString());

  return doc;
}

interface LinkNode { url: string; }

function relativeLink({ doc, mapping }: Options) {
  return tree => {
    const links = selectAll('link', tree) as any as LinkNode[];
    for (const node of links) {
      if (!node.url || !node.url.startsWith('http')) continue;
      const urlObj = new URL(node.url);
      const targetNode = mapping[urlObj.pathname.substring(1)];
      if (urlObj.hostname === hostname && targetNode) {
        node.url = path.relative(path.dirname(doc.filePath), targetNode.filePath) + '.md';
      }
    }
  };
}

function downloadImage(opts: Options) {
  return async tree => {
    const imageNodes = selectAll('image', tree);
    for (const node of imageNodes) {
      const url = (node as any).url;
      const localPath = await download(url, opts.assets);
      // (node as any).url = path.relative(path.dirname(opts.filePath), localPath);
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
