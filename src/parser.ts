import { remark } from 'remark';
import { arrayToTree } from 'performant-array-to-tree';
import crawl from 'tree-crawl';

export async function parser(content, doc) {
  remark()
    // .use(() => tree => {
    // console.log(tree);
    // })
    .process(content);
  return doc;
}

// frontmatter: title, description, tags

interface TreeData {
  title: string;
  type: string;
  uuid: string;
  parent_uuid?: string;
}

interface TocItem {
  type: 'DOC' | 'UNCREATED_DOC' | 'META' | 'LINK';
  title: string;
  uuid: string;
  parent_uuid?: string;
}

interface TreeNode {
  children: TreeNode[];

  type: 'ROOT' | 'DOC' | 'UNCREATED_DOC';
  title: string;
  url: string;
  uuid: string;
  parent_uuid: string;

  basename: string;
  paths: string[];
}

export function parseToc(toc: TocItem[]) {
  const tocList = toc
    .filter(item => item.type !== 'META' && item.type !== 'LINK')
    .map(item => {
      return pick(item, [ 'type', 'title', 'uuid', 'parent_uuid', 'url' ]);
    });

  const treeNodes = arrayToTree(tocList, {
    id: 'uuid',
    parentId: 'parent_uuid',
    nestedIds: false,
    dataField: null,
  }) as TreeNode[];


  const tree = {
    type: 'ROOT',
    children: treeNodes,
    travel(fn: Parameters<typeof crawl<TreeNode>>[1]) {
      crawl<TreeNode>(tree as any, (node, ctx) => {
        if (node.type === 'ROOT') return;
        fn(node, ctx);
      }, { order: 'pre' });
    },
    // * [Symbol.iterator]() {
    //   crawl<TreeNode>(this, (node, ctx) => {
    //     yield { node, ctx}
    //   }, {});
    // }
  };

  const duplicateMap = new Map<string, number>();

  tree.travel((node, ctx) => {
    if (node.type === 'ROOT') return;

    // calculate basename, when duplicate then add index to suffix
    const key = `${node.parent_uuid}/${node.type}/${node.title}`;
    const count = duplicateMap.get(key) || 0;
    if (count) {
      node.basename = `${node.title} ${count}`;
      duplicateMap.set(key, count + 1);
    } else {
      node.basename = node.title;
      duplicateMap.set(key, 1);
    }

    if (node.type === 'DOC' || node.type === 'UNCREATED_DOC') {
      node.basename += '.md';
    }

    node.paths = [ ...ctx.parent.paths || [], node.basename ];

    // console.log(`${' '.repeat(ctx.depth)} - ${node.title} - ${node.paths.join('/')}`);
  });

  return tree;
}

function pick<T>(obj: T, keys: string[]) {
  const result = {};
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result as T;
}
