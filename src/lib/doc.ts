import path from 'path';

import { remark } from 'remark';
import { selectAll } from 'unist-util-select';
import yaml from 'yaml';

import { TreeNode } from './types.js';
import { readJSON, download, getRedirectLink } from './utils.js';
import { config } from '../config.js';

const { host, metaDir, outputDir, userAgent } = config;
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
      // TODO: replace html tags such as <br />
    ])
    .process(docDetail.body);

  doc.content = frontMatter(docDetail) + content.toString();
  return doc;
}

function frontMatter(doc) {
  const frontMatter = yaml.stringify({
    title: doc.title,
    url: `${host}/${doc.book.namespace}/${doc.slug}`,
    // slug: doc.slug,
    // public: doc.public,
    // status: doc.status,
    // description: doc.description,
  });
  return `---\n${frontMatter}\n---\n`;
}

// TODO: remove view=doc_embed
function relativeLink({ doc, mapping }: Options) {
  return async tree => {
    const links = selectAll('link', tree) as any as LinkNode[];
    for (const node of links) {
      if (!isYuqueLink(node.url)) continue;

      if (node.url.startsWith(`${host}/docs/share/`)) {
        node.url = await getRedirectLink(node.url, host);
      }

      // FIXME: yuque should not expose this param at markdown
      node.url = node.url.replace('view=doc_embed', '');

      const { pathname } = new URL(node.url);
      const targetNode = mapping[pathname.substring(1)];
      if (!targetNode) {
        console.warn(`[WARN] ${node.url}, ${pathname.substring(1)} not found`);
      } else {
        node.url = path.relative(path.dirname(doc.filePath), targetNode.filePath) + '.md';
      }
    }
  };
}

function isYuqueLink(url?: string) {
  if (!url) return false;
  if (!url.startsWith(host)) return false;
  if (url.startsWith(host + '/attachments/')) return false;
  return true;
}

function downloadImage(opts: Options) {
  return async tree => {
    const docFilePath = opts.doc.filePath;
    const assetsDir = path.join(docFilePath.split('/')[0], 'assets');

    const imageNodes = selectAll('image', tree) as any as LinkNode[];
    for (const node of imageNodes) {
      if (!node.url || !node.url.startsWith('http')) continue;
      const filePath = path.join(assetsDir, getImageName(node.url));
      await download(node.url, path.join(outputDir, filePath), { headers: { 'User-Agent': userAgent } });
      node.url = path.relative(path.dirname(docFilePath), filePath);
    }
  };
}

// TODO: add doc slug prefix
function getImageName(url) {
  const pathName = new URL(url).pathname;
  return pathName.split('/').pop();
}
