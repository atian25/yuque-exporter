import { remark } from 'remark';

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
}

class TreeNode {
  children: TreeNode[] = [];
  constructor(public data?: TreeData) {}

  add(data: TreeData) {
    this.children.push(new TreeNode(data));
  }

  * [Symbol.iterator]() {
    yield this;
    for (const child of this.children) {
      yield* child;
    }
  }
}

export function parseToc(toc) {
  const docMapping = {};

  // build tree
  const tocMapping = {};
  for (const item of toc) {
    tocMapping[item.uuid] = item;
  }

  const tree = new TreeNode();
  for (const item of toc) {
    if (item.type === 'META') continue;
    const node = { type: item.type, title: item.title, uuid: item.uuid, children: [] };

    if (!item.parent_uuid) {
      tree.add(node);
    } else {
      tocMapping[item.parent_uuid].children.push(node);
    }
  }

  // traverse tree
  const traverse = (node, paths = []) => {

  };

  // switch (item.type) {
  //   case 'TITLE': {
  //     const node = { type: 'TITLE', title: item.title, children: [] };
  //     tree.children.push(node);
  //     break;
  //   }

  //   case 'DOC': {
  //     const node = { type: 'DOC', doc: item.doc, children: [] };
  //     tree.children.push(node);
  //     break;
  //   }

  //   case 'UNCREATED_DOC': {
  //     const node = { type: 'UNCREATED_DOC', doc: item.doc, children: [] };
  //     tree.children.push(node);
  //     break;
  //   }

  //   case 'LINK': break;

  //   case 'META': break;

  //   default: {
  //     console.warn('unknown type', item);
  //     break;
  //   }
  // }
}
