#!/usr/bin/env node

// yuque-exporter --token=<token> --host=<host> --outputDir=<outputDir> --clean=<clean>
// yuque-exporter crawl --token=<token>
// yuque-exporter build

import { parseArgs } from 'util';
import { start } from '../main.js';

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
    default: './yuque',
  },
  clean: {
    type: 'boolean' as const,
    description: 'Whether clean the output target directory',
    default: false,
  },
};

const argv = parseArgs({
  options,
  allowPositionals: true,
  args: process.argv.slice(2),
});

console.log(argv);

await start({ options: argv.values });
