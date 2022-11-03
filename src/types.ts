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

export interface DocInfo {
  title: string;
  slug: string;
  id: string;
}

// TODO multi type node
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

export interface NodeData {
  type: 'TITLE' | 'DOC' | 'UNCREATED_DOC' | 'LINK' | 'REPO' | 'DRAFT_DOC';
  title: string;
  filePath: string;
}

export interface RepoNodeData extends NodeData {
  type: 'REPO';
}

export interface Tree {
  type: 'TITLE' | 'DOC' | 'UNCREATED_DOC' | 'LINK' | 'REPO' | 'DRAFT_DOC';
  title: string;
  filePath?: string;
  url?: string;
  namespace?: string;
}

export interface Doc {
  type: 'TITLE' | 'DOC' | 'UNCREATED_DOC' | 'LINK';
  title: string;
  filePath: string;
  url?: string;
  namespace?: string;
}

export interface DocDetail extends Doc {
  body?: string;
}
