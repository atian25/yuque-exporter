import { Builder } from '../src/builder.js';

describe('test/builder.test.js', () => {
  it('should work', async () => {
    const builder = new Builder('./storage/key_value_stores/yuque', './test/output');
    await builder.build();
  });
});
