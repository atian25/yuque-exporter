import assert from 'assert/strict';
import { CheerioCrawler } from 'crawlee';
import { router } from './routes.js';

assert(process.env.YUQUE_TOKEN, 'Missing YUQUE_TOKEN');

export const crawler = new CheerioCrawler({
  requestHandler: router,
  // maxConcurrency: 2,
  // maxRequestsPerCrawl: 30,
  // maxRequestsPerMinute: 10,
  ignoreSslErrors: true,
  preNavigationHooks: [
    function(_ctx, opts = {}) {
      opts.headers = opts.headers || {};
      opts.headers['X-Auth-Token'] = process.env.YUQUE_TOKEN;
    },
  ],
});

export async function start() {
  await crawler.run([ 'https://www.yuque.com/api/v2/user' ]);
}
