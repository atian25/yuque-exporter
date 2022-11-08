import { readJSON } from '../../src/utils.js';
import { processToc } from '../../src/processor/toc.js';

describe('test/processor/toc.test.js', () => {
  it('should works', async () => {
    const docs = await readJSON('./test/fixtures/docs.json');
    const toc = await readJSON('./test/fixtures/toc.yaml', true);

    const tree = processToc('atian25/test', toc, docs);
    tree.travel((node, index) => {
      // console.log(`${' '.repeat(0)} - ${node.title} - ${node.filePath}`);
      // console.log(`- ${node.filePath}`);
    });

    tree.inspect();
  });
});
