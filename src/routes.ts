import path from 'path';
import { createCheerioRouter, KeyValueStore, RecordOptions } from 'crawlee';
import yaml from 'yaml';

import { writeFile } from './utils.js';
import { config } from './config.js';
const { apiHost, metaDir } = config;

export const router = createCheerioRouter();

router.addDefaultHandler(async ctx => {
  const { log, crawler } = ctx;

  const userInfo = ctx.json.data;

  log.info(`Crawling user: ${userInfo.name}(@${userInfo.login})`);

  await saveToStorage(`${userInfo.login}/user.json`, userInfo);

  await crawler.addRequests([
    {
      url: `${apiHost}/users/${userInfo.login}/repos`,
      label: 'user_repos',
      userData: {
        user: userInfo.login,
      },
    },
  ]);
});

router.addHandler('user_repos', async ctx => {
  const { log, crawler, request } = ctx;

  const repos = ctx.json.data;
  const { user } = request.userData;

  log.info(`Crawling ${repos.length} repos`);
  await saveToStorage(`${user}/repos.json`, repos);

  for (const repo of repos) {
    const { type, name, namespace } = repo;

    if (type !== 'Book') {
      log.warning(`Skip repo: ${name}(${repo.namespace}) due to unsupported type ${type}`);
      continue;
    }

    await crawler.addRequests([
      {
        url: `${apiHost}/repos/${namespace}`,
        label: 'repo_detail',
      },
    ]);
  }
});

router.addHandler('repo_detail', async ctx => {
  const { log, crawler } = ctx;
  const { name, namespace, toc_yml } = ctx.json.data;

  log.info(`Crawling repo toc: ${name}(${namespace})`);

  await saveToStorage(`${namespace}/repo.json`, ctx.json.data);
  await saveToStorage(`${namespace}/toc.json`, yaml.parse(toc_yml));

  await crawler.addRequests([
    {
      url: `${apiHost}/repos/${namespace}/docs`,
      label: 'docs',
      userData: { name, namespace },
    },
  ]);
});

router.addHandler('docs', async ctx => {
  const { log, crawler, request } = ctx;
  const docs = ctx.json.data;
  const { name, namespace } = request.userData;

  log.info(`Crawling docs: ${name}(${namespace})`);

  await saveToStorage(`${namespace}/docs.json`, docs);

  for (const doc of docs) {
    await crawler.addRequests([
      {
        url: `${apiHost}/repos/${namespace}/docs/${doc.slug}`,
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

  log.info(`Crawling doc: ${title}(${namespace}/${slug})`);
  await saveToStorage(`${namespace}/docs/${slug}.json`, doc);
});

router.addHandler('assets', async ctx => {
  const { log, crawler, request } = ctx;
  const { url, userData } = request;
  const { filePath } = userData;

  log.info(`Crawling asset: ${request.url} to ${filePath}`);
  await saveToStorage(filePath, ctx.body);
});

async function saveToStorage(filePath: string, content) {
  await writeFile(path.join(metaDir, filePath), content);
}
