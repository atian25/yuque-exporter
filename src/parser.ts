import { remark } from 'remark';

export async function parser(content, doc) {
  remark()
    // .use(() => tree => {
    // console.log(tree);
    // })
    .process(content);
  return doc;
}

// frontmatter: title, description, tags
