import path from 'path';

export const config = {
  host: 'https://www.yuque.com/',
  token: process.env.YUQUE_TOKEN,
  outputDir: './output',
  get metaDir() {
    return path.join(config.outputDir, '.meta');
  },
};

