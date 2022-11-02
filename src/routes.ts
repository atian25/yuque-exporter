import path from 'path';
import { createCheerioRouter, KeyValueStore, RecordOptions } from 'crawlee';

import { host, root } from './config.js';

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
      },
    ]);
  }
});

router.addHandler('repo_detail', async ctx => {
  const { log, crawler } = ctx;
  const { name, namespace, toc_yml } = ctx.json.data;

  log.info(`Syncing repo toc: ${name}(${namespace})`);

  await saveToStorage(`${namespace}/repo`, ctx.json.data);
  await saveToStorage(`${namespace}/toc`, toc_yml, { contentType: 'text/yaml' });

  await crawler.addRequests([
    {
      url: `${host}/repos/${namespace}/docs`,
      label: 'docs',
      userData: { name, namespace },
    },
  ]);
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

async function saveToStorage(id: string, value: Record<string, any>, options: RecordOptions = {}) {
  const store = await KeyValueStore.open(`yuque/${path.dirname(id)}`);
  await store.setValue(path.basename(id), value, { contentType: options.contentType });
}
