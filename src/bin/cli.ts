#!/usr/bin/env node

// TODO: use yargs or artus-common-bin to refactor it

import { parseArgs } from 'util';
import fs from 'fs/promises';

import { Exporter } from '../main.js';
import { config } from '../config.js';

const options = {
  token: {
    type: 'string' as const,
    description: 'yuque token',
  },
  host: {
    type: 'string' as const,
    description: 'yuque host',
    default: 'https://www.yuque.com',
  },
  outputDir: {
    type: 'string' as const,
    description: 'output target directory',
    default: './storage',
  },
  clean: {
    type: 'boolean' as const,
    description: 'Whether clean the output target directory',
    default: false,
  },
  help: {
    type: 'boolean' as const,
    description: 'Show help',
    short: 'h',
  },
};

const argv = parseArgs({
  options,
  allowPositionals: true,
  args: process.argv.slice(2),
});

if (argv.values.help) {
  const content = await fs.readFile(new URL('./help.md', import.meta.url), 'utf-8');
  console.log(content);
  process.exit(0);
}

// set config
Object.assign(config, argv.values);

const exporter = new Exporter(config);

// execute command
const [ command, ...repos ] = argv.positionals;
switch (command) {
  case 'crawl': {
    await exporter.crawler.run(repos);
    break;
  }

  case 'build': {
    await exporter.builder.run();
    break;
  }

  default: {
    await exporter.run({ urlPaths: argv.positionals });
    break;
  }
}
