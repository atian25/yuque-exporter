#!/usr/bin/env node

// yuque-exporter --token=<token>
// yuque-exporter crawl --token=<token>
// yuque-exporter build

import { parseArgs } from 'util';
import { start } from '../main.js';

const options = {
  token: {
    type: 'string' as const,
  },
  host: {
    type: 'string' as const,
    default: 'https://www.yuque.com',
  },
};

const argv = parseArgs({
  options,
  allowPositionals: true,
  args: process.argv.slice(2),
});

console.log(argv);

await start({ options: argv.values });
