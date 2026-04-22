import { api } from './api-client';

export type KbArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface KbCategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  icon?: string;
  sortOrder?: number;
  createdAt?: string;
}

export interface KbArticle {
  id: string;
  articleId: string;
  tenantId: string;
  categoryId?: string;
  title: string;
  slug?: string;
  body?: string;
  authorId?: string;
  status: KbArticleStatus;
  tags?: string[];
  viewCount?: number;
  searchKeywords?: string[];
  publishedAt?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface CreateKbArticleRequest {
  title: string;
  categoryId?: string;
  body?: string;
  status?: KbArticleStatus;
  tags?: string[];
  searchKeywords?: string[];
}

export const kbService = {
  async getCategories(): Promise<KbCategory[]> {
    return await api.get<KbCategory[]>('/kb/categories');
  },

  async createCategory(data: Partial<KbCategory>): Promise<KbCategory> {
    return await api.post<KbCategory>('/kb/categories', data);
  },

  async getArticles(categoryId?: string): Promise<KbArticle[]> {
    const url = categoryId ? `/kb/articles?categoryId=${categoryId}` : '/kb/articles';
    return await api.get<KbArticle[]>(url);
  },

  async getAllArticles(): Promise<KbArticle[]> {
    return await api.get<KbArticle[]>('/kb/articles/all');
  },

  async getArticleById(articleId: string): Promise<KbArticle> {
    return await api.get<KbArticle>(`/kb/articles/${articleId}`);
  },

  async createArticle(request: CreateKbArticleRequest): Promise<KbArticle> {
    return await api.post<KbArticle>('/kb/articles', request);
  },

  async updateArticle(articleId: string, request: CreateKbArticleRequest): Promise<KbArticle> {
    return await api.put<KbArticle>(`/kb/articles/${articleId}`, request);
  },

  async publishArticle(articleId: string): Promise<KbArticle> {
    return await api.post<KbArticle>(`/kb/articles/${articleId}/publish`, {});
  },

  async archiveArticle(articleId: string): Promise<KbArticle> {
    return await api.post<KbArticle>(`/kb/articles/${articleId}/archive`, {});
  },

  async deleteArticle(articleId: string): Promise<void> {
    await api.delete(`/kb/articles/${articleId}`);
  },

  async searchArticles(q: string): Promise<KbArticle[]> {
    return await api.get<KbArticle[]>(`/kb/search?q=${encodeURIComponent(q)}`);
  },
};
