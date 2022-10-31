import { readJSON } from '../src/utils.js';
import tocParser from '../src/parser/toc.js';

describe('test/parser.test.js', () => {
  it('should praseToc', async () => {
    const toc = await readJSON('./test/fixtures/toc.yaml', true);

    const tree = tocParser(toc);
    tree.travel((node, ctx) => {
      console.log(`${' '.repeat(ctx.depth)} - ${node.title} - ${node.paths.join('/')}`);
    });

    for (const group of tree.groups()) {
      console.log(group);
    }
    for (const doc of tree.docs()) {
      console.log(doc);
    }
  });
});
