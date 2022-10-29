import { fileURLToPath } from 'url';
import { log, KeyValueStore } from 'crawlee';

import { crawler } from './crawler.js';
import { host } from './config.js';

export async function start() {
  const store = await KeyValueStore.open('yuque');
  await store.drop();

  // crawl yuque data
  await crawler.run([ `${host}/user` ]);

  // parse yuque data

}

// Determining if an ESM module is main then run the code
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    await start();
  }
}
