import { fileURLToPath } from 'url';

export const host = 'https://www.yuque.com/api/v2';

export const root = fileURLToPath(new URL('../storage/yuque', import.meta.url));
