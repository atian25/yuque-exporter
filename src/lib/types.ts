export { User, Repo, RepoDetail, Doc, DocDetail } from './sdk.js';

export interface Repository {
  type: string;
  slug: string;
  name: string;
  namespace: string;
  description: string;
}

export interface TocInfo {
  type: 'TITLE' | 'DOC' | 'UNCREATED_DOC' | 'META' | 'LINK';
  title: string;
  uuid: string;
  parent_uuid?: string;
  url?: string;
}

// TODO: multi type node
export interface TreeNode {
  type: 'TITLE' | 'DOC' | 'UNCREATED_DOC' | 'LINK' | 'REPO' | 'DRAFT_DOC';
  children?: TreeNode[];
  uuid: string;
  parent_uuid?: string;
  title?: string;
  url?: string;
  namespace?: string;
  filePath?: string;
  content?: string;
}

