import path from 'path';

import { remark } from 'remark';
import { selectAll } from 'unist-util-select';
import yaml from 'yaml';

import { TreeNode } from './types.js';
import { readJSON, download, getRedirectLink } from './utils.js';
import { config } from '../config.js';

const { host, metaDir, outputDir, userAgent } = config;

interface Options {
  doc: TreeNode;
  mapping: Record<string, TreeNode>;
}

interface ASTNode {
  type: string;
  children?: ASTNode[];
}

interface LinkNode extends ASTNode {
  url: string;
}

interface HtmlNode extends ASTNode {
  value: string;
}

export async function buildDoc(doc: TreeNode, mapping: Record<string, TreeNode>) {
  const docDetail = await readJSON(path.join(metaDir, doc.namespace, 'docs', `${doc.url}.json`));
  const content = await remark()
    .data('settings', { bullet: '-', listItemIndent: 'one' })
    .use([
      [ replaceHtml ],
      [ relativeLink, { doc, mapping }],
      [ downloadImage, { doc, mapping }],
    ])
    .process(docDetail.body);

  doc.content = frontMatter(docDetail) + content.toString();

  // FIXME: remark will transform `*` to `\*`
  doc.content = doc.content.replaceAll('\\*', '*');

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
  return `---\n${frontMatter}---\n\n`;
}

function replaceHtml() {
  return tree => {
    const htmlNodes = selectAll('html', tree) as HtmlNode[];
    for (const node of htmlNodes) {
      if (node.value === '<br />' || node.value === '<br/>') {
        node.type = 'text';
        node.value = '\\n';
      }
    }
  };
}

function relativeLink({ doc, mapping }: Options) {
  return async tree => {
    const links = selectAll('link', tree) as any as LinkNode[];
    for (const node of links) {
      if (!isYuqueLink(node.url)) continue;

      // 语雀分享链接功能已下线，替换为 302 后的地址
      if (node.url.startsWith(`${host}/docs/share/`)) {
        node.url = await getRedirectLink(node.url, host);
      }

      // 语雀链接有多种显示方式，其中一种会插入该参数，会导致点击后的页面缺少头部导航
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
