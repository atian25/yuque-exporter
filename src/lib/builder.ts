import path from 'path';
import PQueue from 'p-queue';
import fg from 'fast-glob';

import type { Repository, TreeNode } from './types.js';
import { logger, mkdir, readJSON, writeFile } from './utils.js';
import { Doc } from './doc.js';
import { Tree } from './tree.js';
import { config } from '../config.js';

export class Builder {
  config: Partial<typeof config>;
  taskQueue: PQueue;
  doc: Doc;
  tree: Tree;
  constructor(options: Partial<typeof config>) {
    this.config = options;
    this.taskQueue = new PQueue({ concurrency: 10 });
    this.doc = new Doc(options);
    this.tree = new Tree(options);
  }
  // TODO: support inputs so only build the specified repos
  async run() {
    logger.info('Start building...');

    const { metaDir, outputDir } = this.config;

    const repos = await this.listRepos();
    if (repos.length === 0) {
      logger.warn(`No repos found at ${metaDir}`);
      return;
    }

    // convert meta to tree
    const tree = await this.tree.build(repos);

    // travel tree to build docs
    const tasks: (() => Promise<void>)[] = [];
    for (const { node } of tree) {
      const fullPath = path.join(outputDir, node.filePath);
      logger.success(fullPath);

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
            const doc = await this.doc.build(node, tree.docs);
            if (doc !== null) {
              const fullPath = path.join(outputDir, `${doc.filePath}.md`);
              logger.success(`Building doc: ${fullPath}`);
              await writeFile(fullPath, doc.content);
            }
          });
          break;

        case 'REPO':
        default:
          break;
      }
    }

    // TODO: only warn when error
    await this.taskQueue.addAll(tasks);
  }
  async listRepos(): Promise<Repository[]> {
    const { metaDir } = this.config;

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
}
