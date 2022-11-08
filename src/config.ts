import path from 'path';

export const config = {
  host: 'https://www.yuque.com',
  token: process.env.YUQUE_TOKEN,
  userAgent: 'yuque-exporter',
  outputDir: './output',
  get metaDir() {
    return path.join(config.outputDir, '.meta');
  },
};

