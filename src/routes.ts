import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { createCheerioRouter, KeyValueStore } from 'crawlee';
import yaml from 'yaml';

const HOST = 'https://www.yuque.com/api/v2';
const STORAGE_PATH = fileURLToPath(new URL('../storage/yuque', import.meta.url));

export const router = createCheerioRouter();

router.addDefaultHandler(async ctx => {
  const { log, crawler } = ctx;

  const userInfo = ctx.json.data;

  log.info(`Syncing user: ${userInfo.name}(@${userInfo.login})`);

  await saveToStorage(`${userInfo.login}/meta.json`, userInfo);

  await crawler.addRequests([
    {
      url: `${HOST}/users/${userInfo.login}/repos`,
      label: 'repos',
      userData: {
        host: HOST,
        user: userInfo.login,
      },
    },
  ]);
});

router.addHandler('repos', async ctx => {
  const { log, crawler, request } = ctx;

  const userData = request.userData;
  const { host, user } = userData;
  const repos = ctx.json.data;

  log.info(`Syncing ${repos.length} repos`);

  for (const repo of repos) {
    const { type, name, slug, namespace } = repo;

    if (type !== 'Book') {
      log.warning(`Skip repo: ${name}(${repo.namespace}) due to unsupported type ${type}`);
      continue;
    }

    log.info(`Syncing repo: ${name}(${repo.namespace})`);

    await saveToStorage(`${namespace}/meta.json`, repo);

    await crawler.addRequests([
      {
        url: `${host}/repos/${namespace}`,
        label: 'repo_detail',
        userData: {
          ...userData,
          namespace,
        },
      },
    ]);
  }
});

router.addHandler('repo_detail', async ctx => {
  const { log, crawler, request } = ctx;
  const userData = request.userData;
  const { host, namespace } = userData;
  const toc_yml = ctx.json.data.toc_yml;
  const toc = normalizeToc(yaml.parse(toc_yml));

  log.info(request.loadedUrl);

  // TODO: parse toc and mkdir
  await saveToStorage(`${namespace}/toc.json`, toc);

  for (const item of toc) {
    const paths = [ STORAGE_PATH, namespace, ...item.paths || [] ].join('/');
    switch (item.type) {
      case 'TITLE': {
        await fs.mkdir(`${paths}/${item.title}`, { recursive: true });
        break;
      }

      case 'DOC': {
        await crawler.addRequests([
          {
            url: `${host}/repos/${namespace}/docs/${item.url}`,
            label: 'doc_detail',
            userData: {
              ...userData,
              paths,
            },
          },
        ]);
        break;
      }

      case 'UNCREATED_DOC': {
        // TODO: create frontmatter
        await saveToStorage(`${paths}/${item.url}.md`, `# ${item.title}`);
        break;
      }

      case 'META': break;
      default:
        log.warning('unknown type', item);
        break;
    }
  }

  // TODO: Sync drafts

});

router.addHandler('doc_detail', async ctx => {
  const { log, crawler, request } = ctx;
  const userData = request.userData;
  const { paths } = userData;
  const doc = ctx.json.data;

  log.info(`Syncing doc: ${doc.title}(${doc.slug}) to ${paths.substring(STORAGE_PATH.length + 1)}/${doc.slug}.md`);

  // TODO: parse markdown with remark
  // TODO: append frontmatter
  // TODO: replace image url
  // TODO: relative link to other docs

  await saveToStorage(`${paths}/${doc.slug}.md`, doc.body);
});

async function saveToStorage(filePath, content) {
  filePath = path.resolve(STORAGE_PATH, filePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  content = typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content, null, 2);
  await fs.writeFile(filePath, content, 'utf-8');
}


function normalizeToc(toc) {
  const mapping = {};
  for (const item of toc) {
    mapping[item.uuid] = item;
  }

  for (const item of toc) {
    if (!item.parent_uuid) continue;
    const paths = [];
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
