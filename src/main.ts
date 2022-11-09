import { fileURLToPath } from 'url';

import { build } from './lib/builder.js';
import { crawl } from './lib/crawler.js';
import { config } from './config.js';

interface StartOptions {
  urlPaths?: string[];
  options?: Partial<typeof config>;
}

export async function start({ urlPaths, options }: StartOptions = {}) {
  // set config
  Object.assign(config, options);

  // crawl yuque data
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
      // 'atian25/blog',
    ];
    await start({ urlPaths });
  }
}
