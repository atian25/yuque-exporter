import assert from 'assert/strict';
import { fileURLToPath } from 'url';

import { build } from './lib/builder.js';
import { logger, rm } from './lib/utils.js';
import { crawl } from './lib/crawler.js';
import { config } from './config.js';

interface StartOptions {
  urlPaths?: string[];
  options?: Partial<typeof config>;
}

export async function start({ urlPaths, options }: StartOptions = {}) {
  Object.assign(config, options);

  assert(config.token, 'Missing token, should provide process.env.YUQUE_TOKEN');

  // crawl yuque data
  await rm(config.metaDir);

  await crawl(urlPaths);

  // process yuque data
  await build();
}

// Determining if an ESM module is main then run the code
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    const urlPaths = [
      'atian25/test',
      'atian25/blog',
    ];
    await start({ urlPaths });
  }
}
