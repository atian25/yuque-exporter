import fs from 'fs/promises';
import path from 'path';
import { readJSON, exists } from './utils';

export class Builder {
  private docMapping = {};

  constructor(
    private readonly src: string,
    private readonly dist: string,
  ) {}

  async build() {
    const repos = await this.loadRepo();
    for (const repo of repos) {
      const docs = await readJSON(path.join(this.src, repo.namespace, 'docs.json'));
    }
    for (const repo of repos) {
      await this.buildRepo(repo);
    }
  }

  async collectMetadata() {
    const repos = await this.loadRepo();
    const docs = {};
    for (const repo of repos) {
      // collect docs metadata
      const repoDocs = await readJSON(path.join(this.src, repo.namespace, 'docs.json'));
      for (const doc of repoDocs) {
        const key = `${repo.namespace}/${doc.slug}`;
        docs[key] = doc;
      }

      // namespace/slug - paths/filename


      // collect toc metadata
      const repoToc = this.calaulateToc(await readJSON(path.join(this.src, repo.namespace, 'toc.yaml'), true));
      for (const item of repoToc) {
        switch (item.type) {
          case 'TITLE': {
            // create directory

            break;
          }

          case 'DOC': {
            break;
          }

          case 'UNCREATED_DOC': {
            break;
          }

          case 'META': break;

          default: {
            console.warn('unknown type', item);
            break;
          }
        }
      }
    }
  }

  calaulateToc(toc) {
    const mapping = {};
    for (const item of toc) {
      mapping[item.uuid] = item;
    }

    const duplicateMapping = new Map();

    for (const item of toc) {
      if (!item.parent_uuid) continue;
      const paths: string[] = [];
      let parent = mapping[item.parent_uuid];
      while (parent) {
        if (parent.paths) {
          paths.push(...parent.paths);
          break;
        }
        // check duplicate title
        const count = duplicateMapping.get(parent.title);
        if (!count) {
          duplicateMapping.set(parent.title, 1);
          paths.push(parent.title);
        } else {
          // if title is duplicate, then add index suffix to title
          duplicateMapping.set(parent.title, count + 1);
          paths.push(`${parent.title}-${count + 1}`);
        }
        parent = mapping[parent.parent_uuid];
      }
      item.paths = paths;
    }
    return toc;
  }

  async loadRepo() {
    const repos = [];
    const dirs = await fs.readdir(this.src);
    for (const dir of dirs) {
      const p = path.join(this.src, dir, 'repos.json');
      if (!await exists(p)) continue;
      const repoInfo = JSON.parse(await fs.readFile(p, 'utf-8'));
      repos.push(repoInfo);
    }
    return repos;
  }
}
