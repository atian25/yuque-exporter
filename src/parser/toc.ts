import { arrayToTree } from 'performant-array-to-tree';
import crawl from 'tree-crawl';

interface TocItem {
  type: 'TITLE' | 'DOC' | 'UNCREATED_DOC' | 'META' | 'LINK';
  title: string;
  uuid: string;
  parent_uuid?: string;
  url?: string;
}

interface TreeNode {
  children: TreeNode[];

  type: 'TITLE' | 'DOC' | 'UNCREATED_DOC';
  title: string;
  url?: string;
  uuid: string;
  parent_uuid?: string;

  namespace?: string;
  filePath: string;
}

export class Toc {
  private constructor(private namespace: string, private children: TreeNode[] = []) {
    this.init();
  }

  travel(fn: (node: TreeNode, ctx: crawl.Context<TreeNode>) => void) {
    crawl(this as any, (node, ctx) => {
      if (node === this) return;
      fn(node, ctx);
    }, { order: 'pre' });
  }

  private init() {
    // calculate file paths, when duplicate then add index to suffix
    const duplicateMap = new Map<string, number>();
    this.travel((node, ctx) => {
      const key = `${node.parent_uuid}/${node.type}/${node.title}`;
      const count = duplicateMap.get(key) || 0;
      if (count) {
        node.filePath = `${node.title} ${count}`;
        duplicateMap.set(key, count + 1);
      } else {
        node.filePath = node.title;
        duplicateMap.set(key, 1);
      }

      if (ctx.parent.filePath) {
        node.filePath = `${ctx.parent.filePath}/${node.filePath}`;
      }

      node.namespace = this.namespace;
    });
  }

  static parse(namespace, toc: TocItem[], docs: any) {
    // collect toc items
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

    // collect draft items
    const slugSet = new Set(tocList.map(item => item.url));
    const draftNode = {
      type: 'TITLE' as const,
      uuid: 'draft',
      title: '草稿箱',
      children: docs.filter(doc => !slugSet.has(doc.slug)).map(doc => {
        return {
          type: 'DOC',
          title: doc.title,
          uuid: doc.id,
          parent_uuid: 'draft',
          url: doc.slug,
        };
      }),
    };

    const tree = new Toc(namespace, [ ...treeNodes as any, draftNode as any ]);
    return tree;
  }
}

function pick<T>(obj: T, keys: string[]) {
  const result = {};
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result as T;
}
