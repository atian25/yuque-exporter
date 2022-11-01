import fs from 'fs/promises';
import path from 'path';
import yaml from 'yaml';

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

export async function mkdir(...paths) {
  await fs.mkdir(path.join(...paths), { recursive: true });
}

export async function writeFile(filePath: string, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  content = typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content, null, 2);
  await fs.writeFile(filePath, content, 'utf-8');
}
