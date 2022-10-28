import assert from 'assert/strict';

import { run } from '../index.js';

describe('test/index.test.js', () => {
  it('should work', async () => {
    const result = await run();
    assert.equal(result, 'Hello World!');
  });
});
