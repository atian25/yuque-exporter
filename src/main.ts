import { Builder } from './lib/builder.js';
import { Crawler } from './lib/crawler.js';
import { config } from './config.js';

interface StartOptions {
  urlPaths?: string[];
  options?: Partial<typeof config>;
}

export class Exporter {
  crawler: Crawler;
  builder: Builder;
  constructor(options: Partial<typeof config>) {
    this.crawler = new Crawler(options);
    this.builder = new Builder(options);
  }
  async run({ urlPaths }: StartOptions = {}) {
    // crawl yuque data
    await this.crawler.run(urlPaths);

    // process yuque data
    await this.builder.run();
  }
}

// const exporter = new Exporter(config);

// // Determining if an ESM module is main then run the code
// if (import.meta.url.startsWith('file:')) {
//   const modulePath = fileURLToPath(import.meta.url);
//   if (process.argv[1] === modulePath) {
//     const urlPaths = [
//       'bufeidefeiyang/blog',
//       // 'atian25/blog',
//     ];
//     await exporter.run({ urlPaths });
//   }
// }
