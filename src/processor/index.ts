import path from 'path';
import PQueue from 'p-queue';
import fg from 'fast-glob';

import type { Repository, TreeNode } from '../types.js';
import { mkdir, readJSON, writeFile } from '../utils.js';
import { buildDoc } from './doc.js';
import { buildTree } from './tree.js';
import { config } from '../config.js';
const { outputDir, metaDir } = config;

const taskQueue = new PQueue({ concurrency: 10 });

export async function build() {
  const repos = await getRepos();

  // convert meta to tree
  const tree = await buildTree(repos);

  // travel tree to build docs
  tree.travel(node => {
    const fullPath = path.join(outputDir, node.filePath);
    console.log(fullPath);
    switch (node.type) {
      case 'TITLE':
        taskQueue.add(() => mkdir(fullPath));
        break;

      case 'UNCREATED_DOC':
        taskQueue.add(() => writeFile(`${fullPath}.md`, ''));
        break;

      case 'LINK':
        taskQueue.add(() => writeFile(`${fullPath}.md`, node.url));
        break;

      case 'DRAFT_DOC':
      case 'DOC':
        taskQueue.add(async () => {
          try {
            if (node.namespace !== 'atian25/test') return;
            const doc = await buildDoc(node, tree.docs);
            console.log(doc.content);
            const fullPath = path.join(outputDir, doc.namespace, `${doc.filePath}.md`);
            await writeFile(fullPath, JSON.stringify(doc, null, 2) + '\n' + doc.content);
          } catch (e) {
            console.log(e)
          }
        });
        break;

      case 'REPO':
      default:
        break;
    }
  });

  // build docs
}

// async function buildDoc(doc: TreeNode, docMapping) {
//   console.log(doc.filePath)
//   // console.log(doc, docMapping);
//   const fullPath = path.join(outputDir, doc.namespace, `${doc.filePath}.md`);
//   const docDetail = await readJSON(path.join(metaDir, doc.namespace, 'docs', `${doc.url}.json`));
//   doc.body = docDetail.body;

  // const content = await processDoc({
  //   src: this.src,
  //   dist: this.dist,
  //   assets: path.join(this.dist, doc.namespace, 'assets'),
  //   filePath: fullPath,
  //   doc,
  //   docMapping,
  // });

  // await writeFile(fullPath, JSON.stringify(doc, null, 2) + '\n' + content);
  // md ast
  // replace link with local link
  // replace image with local image
  // write to file
// }

async function getRepos(): Promise<Repository[]> {
  const repos = [];
  const reposPath = await fg('**/repo.json', { cwd: metaDir, deep: 3 });
  for (const repoPath of reposPath) {
    const repoInfo: Repository = await readJSON(path.join(metaDir, repoPath));
    if (repoInfo.type === 'Book') {
      repos.push(repoInfo);
    }
  }
  return repos;
}
