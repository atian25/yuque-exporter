import assert from 'assert/strict';

import { visit } from 'unist-util-visit';
import { selectAll } from 'unist-util-select';
import { remark } from 'remark';

describe.only('test/index.test.js', () => {
  it('should work', async () => {
    const result = await remark()
      .use(() => tree => {
        const a = selectAll('html', tree);
        console.log(a);
        for (const item of a) {
          item.tagName = 'text';
          item.value = '\\n';
        }
        // visit(tree, 'html', (node, index, parent) => {
        //   console.log(node);
        //   parent.children.splice(index, 1, {
        //     type: 'text',
        //     value: '\\n'
        //   });
        //   return [visit.SKIP, index];
        // });
      })
      .process('## test \n xx <br /> bb \\n\\n**在日常交流中，也经常听到一些同学抱怨，你们大厂的很多场景，我们在日常工作中根本没法涉猎到，又如何才能累积经验，达到要求呢？**确实，目前的前');

    console.log(result.toString());
  });
});
