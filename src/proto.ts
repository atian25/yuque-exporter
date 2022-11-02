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
