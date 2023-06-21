import path from 'path';
import PQueue from 'p-queue';
import yaml from 'yaml';
import fg from 'fast-glob';

import { SDK } from './sdk.js';
import { logger, writeFile, rm, readJSON } from './utils.js';
import { config } from '../config.js';

export class Crawler {
  config: Partial<typeof config>;
  sdk: SDK;
  taskQueue: PQueue;
  constructor(options: Partial<typeof config>) {
    this.config = options;
    const { host, token, userAgent } = this.config;

    this.sdk = new SDK({ token, host, userAgent });
    this.taskQueue = new PQueue({ concurrency: 10 });
  }
  async run(inputs?: string[]) {
    logger.info('Start crawling...');

    const { clean, metaDir } = this.config;

    if (clean) await rm(metaDir);

    // if inputs is empty, crawl all repos of the user which associated with the token
    if (!inputs || inputs.length === 0) inputs = [ '' ];

    // find target repos
    const repoList = new Set<string>();
    for (const input of inputs) {
      const [ user, repo, extra ] = input.split('/');
      if (extra) {
        logger.warn(`invalid url paths: ${input}`);
        continue;
      } else if (repo) {
        // fetch a repo with namespace
        repoList.add(`${user}/${repo}`);
      } else {
        const userInfo = await this.sdk.getUser(user);
        const login = userInfo.login;
        await this.saveToStorage(`${login}/user.json`, userInfo);

        // fetch all repos with user name
        const repos = await this.sdk.getRepos(login);
        await this.saveToStorage(`${login}/repos.json`, repos);
        for (const repo of repos) {
          if (repo.type === 'Book') {
            repoList.add(repo.namespace);
          }
        }
      }
    }
    logger.info(`Find repos to crawl: ${[ '', ...repoList ].join('\n  - ')}\n`);

    // crawl repos
    for (const namespace of repoList) {
      await this.crawlRepo(namespace);
    }
  }
  async crawlRepo(namespace: string) {
    const { host, metaDir } = this.config;

    // crawl repo detail/docs/toc
    logger.success(`Crawling repo detail: ${host}/${namespace}`);
    const repo = await this.sdk.getRepoDetail(namespace);
    const toc = yaml.parse(repo.toc_yml);
    const docList = await this.sdk.getDocs(namespace);

    // crawl repo docs
    const docsPublishedAtPath = await fg('**/docs-published-at.json', { cwd: metaDir, deep: 3 });
    const docsPublishedAtMap: Record<number, string> = typeof docsPublishedAtPath[0] === 'string'
      ? await readJSON(path.join(metaDir, docsPublishedAtPath[0]))
      : {};
    const docChangedList = docList
      .filter(doc => typeof docsPublishedAtMap[doc.id] === 'undefined' || docsPublishedAtMap[doc.id] !== doc.published_at);
    console.log(metaDir);
    console.log(docsPublishedAtMap);
    let docs = [];
    if (docChangedList.length) {
      docs = await this.taskQueue.addAll(docChangedList.map(doc => {
        return async () => {
          logger.success(` - [${doc.title}](${host}/${namespace}/${doc.slug})`);
          const docDetail = await this.sdk.getDocDetail(namespace, doc.slug);
          await this.saveToStorage(`${namespace}/docs/${doc.slug}.json`, docDetail);
        };
      }));
    } else {
      logger.info('Stop crawling, nothing new');
    }

    logger.log('');

    // update meta info
    await this.saveToStorage(`${namespace}/repo.json`, repo);
    await this.saveToStorage(`${namespace}/toc.json`, toc);
    await this.saveToStorage(`${namespace}/docs.json`, docList);
    await this.saveToStorage(`${namespace}/docs-published-at.json`, Object.fromEntries(
      [ ...docList.entries() ].map(([ , doc ]) => [ doc.id, doc.published_at ]),
    ));

    return { repo, toc, docList, docs };
  }
  async saveToStorage(filePath: string, content) {
    const { metaDir } = this.config;

    await writeFile(path.join(metaDir, filePath), content);
  }
}
