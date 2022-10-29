import fs from 'fs/promises';
import path from 'path';

import { createCheerioRouter, KeyValueStore, RecordOptions } from 'crawlee';
import yaml from 'yaml';

import { host, root } from './config.js';
import { parser } from './parser.js';

export const router = createCheerioRouter();

router.addDefaultHandler(async ctx => {
  const { log, crawler } = ctx;

  const userInfo = ctx.json.data;

  log.info(`Syncing user: ${userInfo.name}(@${userInfo.login})`);

  await saveToStorage(`${userInfo.login}/user`, userInfo);

  await crawler.addRequests([
    {
      url: `${host}/users/${userInfo.login}/repos`,
      label: 'repos',
      userData: {
        user: userInfo.login,
      },
    },
  ]);
});

router.addHandler('repos', async ctx => {
  const { log, crawler, request } = ctx;

  const repos = ctx.json.data;
  const { user } = request.userData;

  log.info(`Syncing ${repos.length} repos`);
  await saveToStorage(`${user}/repos`, repos);

  for (const repo of repos) {
    const { type, name, namespace } = repo;

    if (type !== 'Book') {
      log.warning(`Skip repo: ${name}(${repo.namespace}) due to unsupported type ${type}`);
      continue;
    }

    await crawler.addRequests([
      {
        url: `${host}/repos/${namespace}`,
        label: 'repo_detail',
      }, {
        url: `${host}/repos/${namespace}/docs`,
        label: 'docs',
        userData: { name, namespace },
      },
    ]);
  }
});

router.addHandler('repo_detail', async ctx => {
  const { log, crawler } = ctx;
  const { name, namespace, toc_yml } = ctx.json.data;

  log.info(`Syncing repo toc: ${name}(${namespace})`);

  await saveToStorage(`${namespace}/toc`, toc_yml, { contentType: 'text/yaml' });
});

router.addHandler('docs', async ctx => {
  const { log, crawler, request } = ctx;
  const docs = ctx.json.data;
  const { name, namespace } = request.userData;

  log.info(`Syncing docs: ${name}(${namespace})`);

  await saveToStorage(`${namespace}/docs`, docs);

  for (const doc of docs) {
    await crawler.addRequests([
      {
        url: `${host}/repos/${namespace}/docs/${doc.slug}`,
        label: 'doc_detail',
      },
    ]);
  }
});

router.addHandler('doc_detail', async ctx => {
  const { log, crawler, request } = ctx;
  const doc = ctx.json.data;
  const { title, slug } = doc;
  const { namespace } = doc.book;

  log.info(`Syncing doc: ${title}(${namespace}/${slug})`);
  await saveToStorage(`${namespace}/docs/${slug}`, doc);
});

// router.addHandler('repo_detail1', async ctx => {
//   const { log, crawler } = ctx;
//   const { name, namespace, toc_yml } = ctx.json.data;

//   log.info(`Syncing repo detail: ${name}(${namespace})`);

//   await saveToStorage(`${namespace}/toc.yaml`, toc_yml);

//   const toc = normalizeToc(yaml.parse(toc_yml));

//   // log.info(request.loadedUrl);

//   // TODO: parse toc and mkdir
//   await saveToStorage(`${namespace}/toc.yaml`, toc_yml);

//   for (const item of toc) {
//     const paths = [ root, namespace, ...item.paths || [] ].join('/');
//     switch (item.type) {
//       case 'TITLE': {
//         await fs.mkdir(`${paths}/${item.title}`, { recursive: true });
//         break;
//       }

//       case 'DOC': {
//         await crawler.addRequests([
//           {
//             url: `${host}/repos/${namespace}/docs/${item.url}`,
//             label: 'doc_detail',
//             userData: {
//               paths,
//             },
//           },
//         ]);
//         break;
//       }

//       case 'UNCREATED_DOC': {
//         // TODO: create frontmatter
//         await saveToStorage(`${paths}/${item.url}.md`, `# ${item.title}`);
//         break;
//       }

//       case 'META': break;
//       default:
//         log.warning('unknown type', item);
//         break;
//     }
//   }

//   // TODO: Sync drafts

// });

// router.addHandler('doc_detail1', async ctx => {
//   const { log, crawler, request } = ctx;
//   const { paths } = request.userData;
//   const doc = ctx.json.data;

//   await parser(doc.body, doc);

//   log.info(`Syncing doc: ${doc.title}(${doc.slug}) to ${paths.substring(root.length + 1)}/${doc.slug}.md`);

//   // TODO: parse markdown with remark
//   // TODO: append frontmatter
//   // TODO: replace image url
//   // TODO: relative link to other docs

//   await saveToStorage(`${paths}/${doc.slug}.md`, doc.body);
// });

// async function saveToStorage1(filePath, content) {
//   filePath = path.resolve(root, filePath);
//   await fs.mkdir(path.dirname(filePath), { recursive: true });
//   content = typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content, null, 2);
//   await fs.writeFile(filePath, content, 'utf-8');
// }

async function saveToStorage(id: string, value: Record<string, any>, options: RecordOptions = {}) {
  const store = await KeyValueStore.open(`yuque/${path.dirname(id)}`);
  await store.setValue(path.basename(id), value, { contentType: options.contentType });
}


function normalizeToc(toc) {
  const mapping = {};
  for (const item of toc) {
    mapping[item.uuid] = item;
  }

  for (const item of toc) {
    if (!item.parent_uuid) continue;
    const paths: string[] = [];
    let parent = mapping[item.parent_uuid];
    while (parent) {
      if (parent.paths) {
        paths.push(...parent.paths);
        break;
      }
      paths.push(parent.title);
      parent = mapping[parent.parent_uuid];
    }
    item.paths = paths;
  }
  return toc;
}
