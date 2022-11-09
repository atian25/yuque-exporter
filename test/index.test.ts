import assert from 'assert/strict';

import { visit } from 'unist-util-visit';
import { selectAll } from 'unist-util-select';
import { remark } from 'remark';

describe.only('test/index.test.js', () => {
  it('should work', async () => {
    const node = {
      value: 'root',
      children: [
        { value: 'a' },
        { value: 'b', [Symbol.iterator]: myIterator, children: [{ value: 'b1' }, { value: 'b2' }] },
        { value: 'c' },
      ],
      [Symbol.iterator]: myIterator,
    };

    function* myIterator() {
      yield this;
      for (const child of this.children) {
        if (child.children) {
          yield* child;
        } else {
          yield child;
        }
      }
    }

    for (const item of node) {
      console.log(item.value);
    }
  });
});
