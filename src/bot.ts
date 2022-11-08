import path from 'path';
import PQueue from 'p-queue';
import yaml from 'yaml';

import { SDK } from './sdk.js';
import { writeFile } from './utils.js';
import { config } from './config.js';
const { host, token, metaDir } = config;

const sdk = new SDK({ token, host });
const taskQueue = new PQueue({ concurrency: 10 });

export async function crawl(inputs: string[]) {
  console.log('Start crawling...');

  // find target repos
  const repoList = new Set<string>();
  for (const input of inputs) {
    const [ user, repo, extra ] = input.split('/');
    if (extra) {
      console.warn(`invalid url paths: ${input}`);
      continue;
    } else if (repo) {
      // fetch a repo with namespace
      repoList.add(`${user}/${repo}`);
    } else {
      const userInfo = await sdk.getUser(user);
      await saveToStorage(`${user}/user.json`, userInfo);

      // fetch all repos with user name
      const repos = await sdk.getRepos(user);
      await saveToStorage(`${user}/repos.json`, repos);
      for (const repo of repos) {
        if (repo.type === 'Book') {
          repoList.add(repo.namespace);
        }
      }
    }
  }
  console.log(`Find repos to crawl: \n - ${[ ...repoList ].join('\n - ')}`);

  // crawl repos
  for (const namespace of repoList) {
    await crawlRepo(namespace);
  }
}

export async function crawlRepo(namespace: string) {
  // crawl repo detail/docs/toc
  console.log(`Crawling repo detail: ${namespace}`);
  const repo = await sdk.getRepoDetail(namespace);
  const toc = yaml.parse(repo.toc_yml);
  const docList = await sdk.getDocs(namespace);

  await saveToStorage(`${namespace}/repo.json`, repo);
  await saveToStorage(`${namespace}/toc.json`, toc);
  await saveToStorage(`${namespace}/docs.json`, docList);

  // crawl repo docs
  const docs = await taskQueue.addAll(docList.map(doc => {
    return async () => {
      console.log(`Crawling doc detail: ${namespace}/${doc.slug}(${doc.title})`);
      const docDetail = await sdk.getDocDetail(namespace, doc.slug);
      await saveToStorage(`${namespace}/docs/${doc.slug}.json`, docDetail);
    };
  }));

  return { repo, toc, docList, docs };
}

export async function crawlRepoDetail(namespace: string) {
  console.log(`Crawling repo detail: ${namespace}`);

  const repo = await sdk.getRepoDetail(namespace);
  const toc = yaml.parse(repo.toc_yml);
  // await saveToStorage(`${namespace}/repo.json`, repo);
  // await saveToStorage(`${namespace}/toc.json`, toc);
  return repo;
}

// export async function crawlDocDetail({ namespace: string, slug: string}) {

// }

async function saveToStorage(filePath: string, content) {
  await writeFile(path.join(metaDir, filePath), content);
}

await crawl([
  'atian25',
  'atian25/test',
]);
