#!/usr/bin/env node

// TODO: use yargs or artus-common-bin to refactor it
// import path from 'path';
// import { fileURLToPath } from 'url';
import { start } from '@artus-cli/artus-cli';

// const { start } = require('@artus-cli/artus-cli');

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// import { parseArgs } from 'util';
// import fs from 'fs/promises';

// import { Exporter } from '../main.js';
// import { config } from '../config.js';

start();

// const argv = parseArgs({
//   options,
//   allowPositionals: true,
//   args: process.argv.slice(2),
// });

// if (argv.values.help) {
//   const content = await fs.readFile(new URL('./help.md', import.meta.url), 'utf-8');
//   console.log(content);
//   process.exit(0);
// }

// // set config
// Object.assign(config, argv.values);

// const exporter = new Exporter(config);

// // execute command
// const [ command, ...repos ] = argv.positionals;
// switch (command) {
//   case 'crawl': {
//     await exporter.crawler.run(repos);
//     break;
//   }

//   case 'build': {
//     await exporter.builder.run();
//     break;
//   }

//   default: {
//     await exporter.run({ urlPaths: argv.positionals });
//     break;
//   }
// }
