import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import yaml from 'yaml';
import { request } from 'undici';
import consola from 'consola';

export const logger = consola;

export async function readJSON(p: string, isYAML = false) {
  const content = await fs.readFile(p, 'utf-8');
  return isYAML ? yaml.parse(content) : JSON.parse(content);
}

export async function exists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}

export async function mkdir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function rm(p: string) {
  await fs.rm(p, { recursive: true, force: true });
}

export async function writeFile(filePath: string, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  content = typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content, null, 2);
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function getRedirectLink(url: string, host: string) {
  const { headers } = await request(url, { method: 'HEAD' });
  const redirectLink = headers.location;
  if (!redirectLink) return url;
  if (redirectLink[0] === '/') return `${host}${redirectLink}`;
  return redirectLink;
}

export async function download(url: string, filePath: string, opts: any = {}) {
  const { headers, ...otherOpts } = opts;
  const { body, statusCode } = await request(url, {
    headers: {
      'User-Agent': 'yuque-exporter',
      ...headers,
    },
    maxRedirections: 10,
    ...otherOpts,
  });

  if (statusCode !== 200) {
    return url;
  }

  await mkdir(path.dirname(filePath));
  await pipeline(body, createWriteStream(filePath));

  return filePath;
}
