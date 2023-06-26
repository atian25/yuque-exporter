import { DefineCommand } from '@artus-cli/artus-cli';

import { MainCommand } from './main';
import { Crawler } from '../lib/crawler';

@DefineCommand({ command: 'crawl <inputs..>' })
export class CrawlCommand extends MainCommand {
  async run() {
    this.mergeConfig();
    this.crawler = new Crawler(this.config);
    this.crawler.start(this.inputs);
  }
}
