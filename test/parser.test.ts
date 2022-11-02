import { readJSON } from '../src/utils.js';
import { Toc } from '../src/parser/toc.js';
import { visit } from 'unist-util-visit';

describe('test/parser.test.js', () => {
  it('should praseToc', async () => {
    const docs = await readJSON('./test/fixtures/docs.json');
    const toc = await readJSON('./test/fixtures/toc.yaml', true);

    const tree = Toc.parse('atian25/test', toc, docs);
    tree.travel((node, index) => {
      // console.log(`${' '.repeat(0)} - ${node.title} - ${node.filePath}`);
      // console.log(`- ${node.filePath}`);
    });

    tree.inspect();

    // visit(tree as any, (node, index, parent) => {
    //   if (!parent) return;
    //   console.log(node);
    // });
  });
});
