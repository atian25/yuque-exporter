
import { DefineCommand, Command, Option } from '@artus-cli/artus-cli';
import { Builder } from '../lib/builder';
import { Crawler } from '../lib/crawler';
import { config } from '../config/default';

@DefineCommand({
  command: '$0 <inputs..>',
})
export class MainCommand extends Command {
  @Option({ required: true, description: 'yuque token' })
  token: string;

  @Option({ default: 'https://www.yuque.com', description: 'yuque host' })
  host: string;

  @Option({ default: './storage', description: 'output target directory' })
  outputDir: string;

  @Option({ default: false, description: 'Whether clean the output target directory' })
  clean: boolean;

  @Option({ alias: 'h', description: 'Show help' })
  help: boolean;

  @Option()
  inputs: string[];

  config: Partial<typeof config> = config;
  crawler: Crawler;
  builder: Builder;
  async run() {
    this.mergeConfig();
    this.crawler = new Crawler(this.config);
    this.builder = new Builder(this.config);
    await this.crawler.start(this.inputs);
    await this.builder.start(this.inputs);
  }
  async mergeConfig() {
    const { token, host, outputDir, clean, help } = this;
    Object.assign(this.config, { token, host, outputDir, clean, help });
  }
  // TODO: user config support
  // async loadUserConfig() {
  //   this.userConfig = await import(path.join(__dirname, this.config.configPath));
  //   console.log(this.userConfig);
  // }
}
