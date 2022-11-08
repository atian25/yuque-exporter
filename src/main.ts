import assert from 'assert/strict';
import { fileURLToPath } from 'url';

import { crawler, startCrawl } from './crawler.js';
import { build } from './processor/index.js';
import { rm } from './utils.js';
import { crawl } from './bot.js';
import { config } from './config.js';

export async function start(urlPaths: string[], opts?: Partial<typeof config>) {
  Object.assign(config, opts || {});

  assert(config.token, 'Missing token, should provide process.env.YUQUE_TOKEN');

  // crawl yuque data
  await rm(config.metaDir);
  // console.log(`Crawling output to ${config.outputDir}`);
  // await startCrawl(urlPaths);

  await crawl(urlPaths);

  // process yuque data
  await build();
}

// Determining if an ESM module is main then run the code
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    const urls = [
      'atian25/test',
      'atian25/blog',
    ];
    await start(urls);
  }
}
