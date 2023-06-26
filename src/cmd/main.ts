
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

  @Option({ default: [ '' ], description: 'inputs' })
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
  // async loadUserConfig() {
  //   this.userConfig = await import(path.join(__dirname, this.config.configPath));
  //   console.log(this.userConfig);
  // }
}

// export class Exporter {
//   crawler: Crawler;
//   builder: Builder;
//   constructor(options: Partial<typeof config>) {
//     this.crawler = new Crawler(options);
//     this.builder = new Builder(options);
//   }
//   async run({ urlPaths }: StartOptions = {}) {
//     // crawl yuque data
//     await this.crawler.run(urlPaths);

//     // process yuque data
//     await this.builder.run();
//   }
// }

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
