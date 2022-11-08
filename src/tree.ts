import path from 'path';
import { visit } from 'unist-util-visit';
import { inspectNoColor } from 'unist-util-inspect';
import { arrayToTree } from 'performant-array-to-tree';

import type { DocInfo, Repository, TocInfo, TreeNode } from './types';
import { readJSON } from './utils.js';
import { config } from './config.js';
const { metaDir } = config;

interface TravelResult {
  node: TreeNode;
  index: number;
  parent?: TreeNode;
}

export async function buildTree(repos: Repository[]) {
  const tree = {
    children: [] as TreeNode[],
    docs: {} as Record<string, TreeNode>,

    // TODO: repos node could be travel
    travel(fn: (args: TravelResult) => void) {
      visit<TreeNode>(this as any, (node, index, parent?: TreeNode) => {
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
      return console.log(inspectNoColor(this.children));
    },
  };

  // build repo tree
  for (const repo of repos) {
    const node = await buildRepoTree(repo);
    tree.children.push(node);
  }

  // calculate file paths, when duplicate then add index to suffix
  const duplicateMap = new Map<string, number>();

  tree.travel(args => {
    const { node, parent } = args;
    const { title, type, parent_uuid } = node;
    const key = `${parent_uuid}/${type}/${title}`;
    const count = duplicateMap.get(key) || 0;
    if (count) {
      node.filePath = `${node.title} ${count}`;
      duplicateMap.set(key, count + 1);
    } else {
      node.filePath = node.title;
      duplicateMap.set(key, 1);
    }

    if (parent.filePath) {
      // TODO: sanitize-filename
      node.filePath = `${parent.filePath}/${node.filePath}`;
    }

    if (type === 'DOC' || type === 'UNCREATED_DOC' || type === 'DRAFT_DOC') {
      const key = `${node.namespace}/${node.url}`;
      tree.docs[key] = node;
    }
  });

  return tree;
}

export async function buildRepoTree(repo: Repository) {
  const repoNode: TreeNode = {
    type: 'REPO',
    title: repo.name,
    namespace: repo.namespace,
    url: repo.namespace,
    uuid: repo.namespace,
    parent_uuid: '',
    children: [],
  };

  const docs: DocInfo[] = await readJSON(path.join(metaDir, repo.namespace, 'docs.json'));
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
        uuid: doc.id,
        parent_uuid: repoNode.uuid,
        url: doc.slug,
        namespace: repo.namespace,
      };
      return node;
    });

  repoNode.children = [ ...childNodes, ...draftNodes ];
  return repoNode;
}
