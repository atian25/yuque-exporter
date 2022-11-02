import fs from 'fs/promises';
import path from 'path';
import PQueue from 'p-queue';
import fg from 'fast-glob';

import { readJSON, exists, mkdir, writeFile } from './utils.js';
import { processToc } from './processor/toc.js';
import { processDoc } from './processor/doc.js';

export class Builder {
  private docMapping = {};
  private taskQueue = new PQueue({ concurrency: 10 });

  constructor(private readonly src: string, private readonly dist: string) {}

  async build() {
    const docMapping = new Map();

    const repos = await this.loadRepo();
    for (const repo of repos) {
      const docs = await readJSON(path.join(this.src, repo.namespace, 'docs.json'));
      const toc = await readJSON(path.join(this.src, repo.namespace, 'toc.yaml'), true);
      const tocTree = processToc(repo.namespace, toc, docs);

      tocTree.travel(node => {
        const fullPath = path.join(this.dist, repo.namespace, node.filePath);
        // console.log(fullPath);
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
      }

      await this.taskQueue.onIdle();
    }
  }

  async buildDoc(doc, docMapping) {
    console.log(doc.filePath)
    // console.log(doc, docMapping);
    const fullPath = path.join(this.dist, doc.namespace, `${doc.filePath}.md`);
    const docDetail = await readJSON(path.join(this.src, doc.namespace, 'docs', `${doc.url}.json`));
    doc.body = docDetail.body;

    const content = await processDoc({
      src: this.src,
      dist: this.dist,
      assets: path.join(this.dist, doc.namespace, 'assets'),
      filePath: fullPath,
      doc,
      docMapping,
    });

    await writeFile(fullPath, JSON.stringify(doc, null, 2) + '\n' + content);
    // md ast
    // replace link with local link
    // replace image with local image
    // write to file
  }

  async loadRepo() {
    const repos = [];
    const reposPath = await fg('**/repo.json', { cwd: this.src, deep: 3 });
    for (const repoPath of reposPath) {
      const repoInfo = await readJSON(path.join(this.src, repoPath));
      if (repoInfo.type === 'Book') {
        repos.push(repoInfo);
      }
    }
    return repos;
  }
}
