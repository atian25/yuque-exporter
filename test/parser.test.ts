import assert from 'assert/strict';
import fs from 'fs/promises';
import { arrayToTree } from 'performant-array-to-tree';
import crawl from 'tree-crawl';

import { readJSON } from '../src/utils.js';
import { parseToc } from '../src/parser.js';

describe('test/parser.test.js', () => {
  it('should praseToc', async () => {
    const toc = await readJSON('./test/fixtures/toc.yaml', true);
    // const tree = arrayToTree(toc, {
    //   id: 'uuid',
    //   parentId: 'parent_uuid',
    //   nestedIds: false,
    // });

    // interface TreeNode {
    //   children: TreeNode[];
    //   data?: Record<string, any>;
    // }

    // // crawl(tree, console.log);
    // crawl<TreeNode>({ children: tree } as TreeNode, (node, ctx) => {
    //   const { data } = node;
    //   if (!data || data.type === 'META') return;
    //   console.log(' '.repeat(data.level) + ' - ' + data.title, ctx.level, ctx.depth, ctx.index);
    // }, {});

    const tree = parseToc(toc);
    tree.travel((node, ctx) => {
      console.log(`${' '.repeat(ctx.depth)} - ${node.title} - ${node.paths.join('/')}`);
    });
    // console.log(tree);
    // for (const item of tree) {
    //   const { data } = item;
    //   if (!data) continue;
    //   console.log(' '.repeat(data.level) + ' - ' + data.title);
    // }
  });
});
