import fs from 'fs/promises';
import path from 'path';
import PQueue from 'p-queue';

import { readJSON, exists, mkdir, writeFile } from './utils.js';
import { Toc } from './parser/toc.js';
import { remark } from 'remark';
import { visit } from 'unist-util-visit';

export class Builder {
  private docMapping = {};
  private taskQueue = new PQueue({ concurrency: 10 });

  constructor(
    private readonly src: string,
    private readonly dist: string,
  ) {}

  async build() {
    const docMapping = new Map();

    const repos = await this.loadRepo();
    for (const repo of repos) {
      const docs = await readJSON(path.join(this.src, repo.namespace, 'docs.json'));
      const toc = await readJSON(path.join(this.src, repo.namespace, 'toc.yaml'), true);
      const tocTree = Toc.parse(repo.namespace, toc, docs);

      tocTree.travel(node => {
        const fullPath = path.join(this.dist, repo.namespace, node.filePath);
        console.log(fullPath);
        switch (node.type) {
          case 'TITLE':
            this.taskQueue.add(() => mkdir(fullPath));
            break;

          case 'UNCREATED_DOC':
            this.taskQueue.add(() => writeFile(`${fullPath}.md`, ''));
            break;

          case 'LINK':
            this.taskQueue.add(() => writeFile(`${fullPath}.md`, node.url));
            break;

          case 'DOC':
            docMapping.set(`${repo.namespace}/${node.url}`, node);
            break;

          default:
            break;
        }
      });

      for (const node of docMapping.values()) {
        this.taskQueue.add(() => this.buildDoc(node, docMapping));
        break;
      }
    }
  }

  async buildDoc(doc, docMapping) {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    // console.log(doc, docMapping);
    const fullPath = path.join(this.dist, doc.namespace, `${doc.filePath}.md`);
    const docDetail = await readJSON(path.join(this.src, doc.namespace, 'docs', `${doc.url}.json`));
    const content = await remark()
      .use(() => async tree => {
        console.log('aaa');
        await sleep(3000);
        visit(tree, [ 'link', 'linkReference' ], function(node) {
          (node as any).url += 'xxxxx';
        });
      })
      .use(() => tree => {
        console.log('bbb');
      })
      .process(docDetail.body);
    console.log('ccc');
    await writeFile(fullPath, JSON.stringify(doc, null, 2) + '\n' + content);
    // md ast
    // replace link with local link
    // replace image with local image
    // write to file
  }

  async loadRepo() {
    const repos = [];
    const dirs = await fs.readdir(this.src);
    for (const dir of dirs) {
      const p = path.join(this.src, dir, 'repos.json');
      if (!await exists(p)) continue;
      const repoInfo = JSON.parse(await fs.readFile(p, 'utf-8'));
      repos.push(...repoInfo.filter(repo => repo.type === 'Book'));
    }
    return repos;
  }
}

function collectDraftDocs(docs, toc) {
  const set = new Set(toc.filter(item => item.type === 'DOC').map(item => item.url));
  return docs.filter(doc => !set.has(doc.slug));
}
