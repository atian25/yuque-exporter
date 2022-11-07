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
  const repos = await listRepos();
  if (repos.length === 0) {
    console.log(`No repos found at ${metaDir}`);
    return;
  }

  // convert meta to tree
  const tree = await buildTree(repos);

  // travel tree to build docs
  const tasks: (() => Promise<void>)[] = [];
  for (const { node } of tree) {
    const fullPath = path.join(outputDir, node.filePath);
    console.log(fullPath);
    switch (node.type) {
      case 'TITLE':
        tasks.push(() => mkdir(fullPath));
        break;

      case 'UNCREATED_DOC':
        tasks.push(() => writeFile(`${fullPath}.md`, ''));
        break;

      case 'LINK':
        tasks.push(() => writeFile(`${fullPath}.md`, node.url));
        break;

      case 'DRAFT_DOC':
      case 'DOC':
        tasks.push(async () => {
          if (node.namespace !== 'atian25/test') return

          const doc = await buildDoc(node, tree.docs);
          const fullPath = path.join(outputDir, `${doc.filePath}.md`);
          await writeFile(fullPath, doc.content);
        });
        break;

      case 'REPO':
      default:
        break;
    }
  }

  // TODO: only warn when error
  await taskQueue.addAll(tasks);
}

async function listRepos(): Promise<Repository[]> {
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
