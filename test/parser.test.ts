import { readJSON } from '../src/utils.js';
import { Toc } from '../src/parser/toc.js';

describe('test/parser.test.js', () => {
  it('should praseToc', async () => {
    const docs = await readJSON('./test/fixtures/docs.json');
    const toc = await readJSON('./test/fixtures/toc.yaml', true);

    const tree = Toc.parse('atian25/test', toc, docs);
    tree.travel((node, ctx) => {
      console.log(`${' '.repeat(ctx.depth)} - ${node.title} - ${node.filePath}`);
    });
  });
});
