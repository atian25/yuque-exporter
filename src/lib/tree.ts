import path from 'path';
import filenamify from 'filenamify';
import visit from 'unist-util-visit';
// import inspect from 'unist-util-inspect';
import { arrayToTree } from 'performant-array-to-tree';

import type { Doc, Repository, TocInfo, TreeNode } from './types';
import { readJSON } from './utils';
import { config } from '../config/default';

interface TravelResult {
  node: TreeNode;
  index: number;
  parent?: TreeNode;
}

export class Tree {
  config: Partial<typeof config>;
  constructor(options: Partial<typeof config>) {
    this.config = options;
  }
  async build(repos: Repository[]) {
    const tree = {
      children: [] as TreeNode[],
      docs: {} as Record<string, TreeNode>,

      // TODO: repos node could be travel
      travel(fn: (args: TravelResult) => void) {
        visit<TreeNode>(this as any, null, (node, index, parent) => {
          if (!parent) return;
          fn({ node, index, parent });
        });
      },

      * [Symbol.iterator]() {
        const result: TravelResult[] = [];
        this.travel(args => result.push(args));
        yield* result;
      },

      inspect() {
        // TODO: unist-util-inspect old api type compatibility
        // return console.log(inspect.noColor(this.children));
      },
    };

    // build repo tree
    for (const repo of repos) {
      const node = await this.buildRepo(repo);
      tree.children.push(node);
    }

    // calculate file paths, when duplicate then add index to suffix
    const duplicateMap = new Map<string, number>();

    tree.travel(args => {
      const { node, parent } = args;
      const { type, parent_uuid } = node;

      const title = filenamify(node.title, { replacement: '_' });
      const key = `${parent_uuid}/${type}/${title}`;
      const count = duplicateMap.get(key) || 0;
      if (count) {
        // TODO: whether use slug as key suffix?
        node.filePath = `${title}_${count}`;
        duplicateMap.set(key, count + 1);
      } else {
        node.filePath = title;
        duplicateMap.set(key, 1);
      }

      if (parent.filePath) {
        node.filePath = `${parent.filePath}/${node.filePath}`;
      }

      if (type === 'DOC' || type === 'UNCREATED_DOC' || type === 'DRAFT_DOC') {
        const key = `${node.namespace}/${node.url}`;
        tree.docs[key] = node;
      }
    });

    return tree;
  }

  async buildRepo(repo: Repository) {
    const { metaDir } = this.config;

    const repoNode: TreeNode = {
      type: 'REPO',
      title: repo.name,
      namespace: repo.namespace,
      url: repo.namespace,
      uuid: repo.namespace,
      parent_uuid: '',
      children: [],
    };

    const docs: Doc[] = await readJSON(path.join(metaDir, repo.namespace, 'docs.json'));
    const toc: TocInfo[] = await readJSON(path.join(metaDir, repo.namespace, 'toc.json'));

    // collect toc items
    const tocList = toc
      .filter(item => item.type !== 'META')
      .map(item => {
        return {
          type: item.type,
          title: item.title,
          uuid: item.uuid,
          parent_uuid: item.parent_uuid || repoNode.uuid,
          url: item.url,
          namespace: repo.namespace,
        };
      });

    const childNodes = arrayToTree(tocList, {
      id: 'uuid',
      parentId: 'parent_uuid',
      nestedIds: false,
      rootParentIds: { [repoNode.uuid]: true },
      dataField: null,
    }) as TreeNode[];

    // collect draft items
    const slugSet = new Set(tocList.map(item => item.url));
    const draftNodes: TreeNode[] = docs
      .filter(doc => !slugSet.has(doc.slug))
      .map(doc => {
        const node: TreeNode = {
          type: 'DRAFT_DOC',
          title: doc.title,
          uuid: String(doc.id),
          parent_uuid: repoNode.uuid,
          url: doc.slug,
          namespace: repo.namespace,
        };
        return node;
      });

    repoNode.children = [ ...childNodes, ...draftNodes ];
    return repoNode;
  }
}
