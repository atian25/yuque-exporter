import { request, Dispatcher } from 'undici';

export interface SDKOptions {
  token: string;
  host?: string;
  useAgent?: string;
}

export interface ResponseData<T> {
  data?: T;
  message?: string;
  code?: number;
}

export interface User {
  id: number;
  type: string;
  login: string;
  name: string;
  description: string;
  avatar_url: string;
  books_count: number;
  public_books_count: number;
  followers_count: number;
  following_count: number;
  public: number;
  created_at: string;
  updated_at: string;
}

export interface Repo {
  id: number;
  type: string;
  namespace: string;
  slug: string;
  name: string;
  description: string;
  creator_id: number;
  public: number;
  items_count: number;
  likes_count: number;
  watches_count: number;
  content_updated_at: Date;
  updated_at: Date;
  created_at: Date;
  user_id: number;
  user: User;
}

export interface RepoDetail extends Repo {
  toc: string;
  toc_yml: string;
}

export interface Doc {
  id: number;
  slug: string;
  title: string;
  description: string;
  user_id: number;
  book_id: number;
  format: string;
  public: number;
  status: number;
  view_status: number;
  read_status: number;
  likes_count: number;
  read_count: number;
  comments_count: number;
  content_updated_at: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  first_published_at: string;
  draft_version: number;
  last_editor_id: number;
  word_count: number;
  cover?: any;
  custom_description?: any;
  last_editor: User;
  book: Repo;
}

export interface DocDetail extends Doc {
  body: string;
  body_draft: string;
  body_html: string;
  body_lake: string;
  body_draft_lake: string;
}

export class SDK {
  private token: string;
  private host: string;
  private userAgent: string;

  constructor(opts: SDKOptions) {
    this.token = opts.token;
    this.host = opts.host || 'https://www.yuque.com';
    this.userAgent = opts.useAgent || 'yuque-sdk';
  }

  async getUser(user: string) {
    return await this.requestAPI<User>(`users/${user}`);
  }

  async getRepos(user: string) {
    return await this.requestAPI<Repo[]>(`users/${user}/repos`);
  }

  async getRepoDetail(namespace: string) {
    return await this.requestAPI<RepoDetail>(`repos/${namespace}`);
  }

  async getDocs(namespace: string) {
    return await this.requestAPI<Doc[]>(`repos/${namespace}/docs`);
  }

  async getDocDetail(namespace: string, slug: string) {
    return await this.requestAPI<DocDetail>(`repos/${namespace}/docs/${slug}`);
  }

  async request<T>(api: string): Promise<ResponseData<T>> {
    const opts: Dispatcher.RequestOptions = {
      method: 'GET',
      path: `/api/v2/${api}`,
      headers: {
        'X-Auth-Token': this.token,
        'User-Agent': this.userAgent || 'yuque-sdk',
      },
      maxRedirections: 5,
    };

    const { statusCode, body } = await request(this.host, opts);
    const json: ResponseData<T> = await body.json();

    if (statusCode !== 200) {
      throw new Error(`request ${this.host}/api/v2/${api} failed: ${JSON.stringify(json)}`);
    }
    return json;
  }

  async requestAPI<T>(api: string): Promise<T> {
    return await this.request<T>(api).then(x => x.data);
  }
}
