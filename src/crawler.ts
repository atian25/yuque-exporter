import { CheerioCrawler, Configuration, purgeDefaultStorages, RequestOptions } from 'crawlee';

import { router } from './routes.js';
import { config } from './config.js';
const { host, token } = config;

export const crawler = new CheerioCrawler({
  requestHandler: router,
  // maxConcurrency: 2,
  // maxRequestsPerCrawl: 30,
  // maxRequestsPerMinute: 10,
  ignoreSslErrors: true,
  preNavigationHooks: [
    function auth(ctx, opts = {}) {
      opts.headers = opts.headers || {};
      // only add when host is yuque
      if (ctx.request.url.startsWith(host)) {
        opts.headers['X-Auth-Token'] = token;
      }
    },
  ],
}, new Configuration({ purgeOnStart: false }));

export async function startCrawl(urlPaths: string[]) {
  const requests = urlPaths.map(urlPath => buildRequest(config.host, urlPath)).filter(x => !!x);
  console.log(requests.map(x => x.userData.description));
  await crawler.run(requests);
}

function buildRequest(host: string, urlPath: string): RequestOptions {
  const [ user, repo, extra ] = urlPath.split('/');
  if (extra) {
    console.warn(`invalid url paths: ${urlPath}`);
    return undefined;
  } else if (repo) {
    // fetch a repo with namespace
    return {
      url: `${host}/repos/${user}/${repo}`,
      label: 'repo_detail',
      userData: {
        user,
        description: `Crawling repo: ${user}/${repo}`,
      },
    };
  } else {
    // fetch all repos with user name
    return {
      url: `${host}/users/${user}/repos`,
      label: 'user_repos',
      userData: {
        user,
        description: `Crawling all repos of user: ${user}`,
      },
    };
  }
}
