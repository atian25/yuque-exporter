import { readJSON } from '../../src/utils.js';
import { processDoc } from '../../src/processor/doc.js';

describe('test/processor/doc.test.js', () => {
  it('should works', async () => {
    await processDoc({
      src: './test/fixtures',
      dist: './test/output',
      doc: {
        body: '# Hello\n[aa](https://baidu.com)\n![bbb](https://baidu.com/1.png)\nxxxx\n![ccc](https://baidu.com/2.png)',
      } as any,
    });
  });
});
