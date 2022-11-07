import path from 'path';
import fs from 'fs';
import { pipeline } from 'stream/promises';

import { remark } from 'remark';
import { selectAll } from 'unist-util-select';
import yaml from 'yaml';
import { request } from 'undici';

import { TreeNode } from '../types.js';
import { readJSON } from '../utils.js';
import { crawler } from '../crawler.js';
import { config } from '../config.js';

const { host, metaDir, outputDir } = config;
const hostname = new URL(host).hostname;

interface Options {
  doc: TreeNode;
  mapping: Record<string, TreeNode>;
}

interface LinkNode { url: string; }

export async function buildDoc(doc: TreeNode, mapping: Record<string, TreeNode>) {
  const docDetail = await readJSON(path.join(metaDir, doc.namespace, 'docs', `${doc.url}.json`));
  const content = await remark()
    .use([
      [ relativeLink, { doc, mapping }],
      [ downloadImage, { doc, mapping }],
    ])
    .process(docDetail.body);

  doc.content = frontMatter(doc) + content.toString();
  return doc;
}

function frontMatter(doc) {
  const frontMatter = yaml.stringify({
    title: doc.title,
    slug: doc.slug,
    public: doc.public,
    status: doc.status,
    description: doc.description,
  });
  return `---\n${frontMatter}\n---\n`;
}

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
    const docFilePath = opts.doc.filePath;
    const assetsDir = path.join(docFilePath.split('/')[0], 'assets');

    const imageNodes = selectAll('image', tree) as any as LinkNode[];
    for (const node of imageNodes) {
      if (!node.url || !node.url.startsWith('http')) continue;
      const filePath = path.join(assetsDir, getImageName(node.url));
      await download(node.url, filePath);
      node.url = path.relative(path.dirname(docFilePath), filePath);
    }
  };
}

async function download(url, filePath) {
  const { body, statusCode } = await request(url, {
    headers: {
      'user-agent': 'yuque-exporter',
    },
  });

  if (statusCode !== 200) {
    return url;
  }

  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await pipeline(body, fs.createWriteStream(filePath));
}

function getImageName(url) {
  const pathName = new URL(url).pathname;
  return pathName.split('/').pop();
}
