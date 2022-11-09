import path from 'path';

export const config = {
  host: 'https://www.yuque.com',
  token: process.env.YUQUE_TOKEN,
  userAgent: 'yuque-exporter',
  outputDir: './storage',
  clean: false,
  get metaDir() {
    return path.join(config.outputDir, '.meta');
  },
};

