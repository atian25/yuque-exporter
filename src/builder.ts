import fs from 'fs/promises';
import path from 'path';
import { readJSON, exists, mkdir } from './utils.js';
import { Toc } from './parser/toc.js';

export class Builder {
  private docMapping = {};
  private taskQueue = [];

  constructor(
    private readonly src: string,
    private readonly dist: string,
  ) {}

  async build() {
    const docMapping = {};
    const dirList = [];

    const repos = await this.loadRepo();
    for (const repo of repos) {
      const docs = await readJSON(path.join(this.src, repo.namespace, 'docs.json'));
      const toc = await readJSON(path.join(this.src, repo.namespace, 'toc.yaml'), true);
      const tocTree = Toc.parse(repo.namespace, toc, docs);
      tocTree.travel(node => {
        console.log(node.filePath);
        if (node.type === 'TITLE') {
          dirList.push(`${repo.namespace}/${node.filePath}`);
        } else if (node.type === 'DOC') {
          docMapping[`${repo.namespace}/${node.url}`] = node;
        }
      });
    }
    // console.log(dirList);

  }

  createJob(...paths) {
    this.taskQueue.push(() => mkdir(this.dist, ...paths));
  }

  async buildDoc(doc, docMapping) {
    console.log(doc, docMapping);
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
