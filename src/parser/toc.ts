import { arrayToTree } from 'performant-array-to-tree';
import crawl from 'tree-crawl';

interface TocItem {
  type: 'TITLE' | 'DOC' | 'UNCREATED_DOC' | 'META' | 'LINK';
  title: string;
  uuid: string;
  parent_uuid?: string;
}

interface TreeNode {
  children: TreeNode[];

  type: 'ROOT' | 'TITLE' | 'DOC' | 'UNCREATED_DOC';
  title: string;
  url: string;
  uuid: string;
  parent_uuid: string;

  basename: string;
  paths: string[];
  filePath: string;
}

export default function parse(toc: TocItem[]) {
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

    groups() {
      const paths: string[] = [];
      tree.travel(node => {
        if (node.type === 'TITLE') {
          paths.push(node.paths.join('/'));
        }
      });
      return paths;
    },

    docs(): { title: string; slug: string; filePath: string }[] {
      const result = [];
      tree.travel(node => {
        if (node.type === 'DOC') {
          result.push({
            title: node.title,
            slug: node.url,
            filePath: node.paths.join('/') + '.md',
          });
        }
      });
      return result;
    },
  };

  // calculate file paths, when duplicate then add index to suffix
  const duplicateMap = new Map<string, number>();
  tree.travel((node, ctx) => {
    const key = `${node.parent_uuid}/${node.type}/${node.title}`;
    const count = duplicateMap.get(key) || 0;
    if (count) {
      node.basename = `${node.title} ${count}`;
      duplicateMap.set(key, count + 1);
    } else {
      node.basename = node.title;
      duplicateMap.set(key, 1);
    }

    node.paths = [ ...ctx.parent.paths || [], node.basename ];
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
