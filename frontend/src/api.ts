export interface SourceRow {
  id: number;
  channel: string;
  raw_type: string;
  raw_url: string | null;
  raw_text: string | null;
  transcript: string | null;
  status: 'pending' | 'processed' | 'rejected' | 'error';
  captured_at: string;
  error_message: string | null;
}

export interface FolderRow {
  id: number;
  name: string;
  category: string;
}

export interface TagRow {
  id: number;
  name: string;
  source?: 'ai' | 'manual';
}

export interface ArticleRow {
  id: number;
  source_id: number;
  title: string;
  summary: string;
  nature: string;
  legitimacy_note: string;
  why_interesting: string;
  augmentation_note: string;
  category: string;
  folder_id: number | null;
  folder: FolderRow | null;
  qualified_at: string;
  tags: TagRow[];
  relevance_score: number;
  mood_summary: string | null;
}

export interface RepostRow {
  id: number;
  article_id: number;
  platform: string;
  content: string;
  created_at: string;
  published: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
}

export interface ReactionRow {
  id: number;
  article_id: number;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  reason: string;
  collected_at: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  return res.json();
}

export const api = {
  listSources: () => request<SourceRow[]>('/sources'),
  captureUrl: (url: string) => request<SourceRow>('/sources', { method: 'POST', body: JSON.stringify({ url }) }),
  captureText: (text: string) => request<SourceRow>('/sources', { method: 'POST', body: JSON.stringify({ text }) }),
  processSource: (id: number) => request<{ articleId: number }>(`/sources/${id}/process`, { method: 'POST' }),

  listFolders: () => request<FolderRow[]>('/folders'),
  listTags: () => request<TagRow[]>('/tags'),

  listArticles: (params?: { folderId?: number; tag?: string }) => {
    const qs = new URLSearchParams();
    if (params?.folderId) qs.set('folderId', String(params.folderId));
    if (params?.tag) qs.set('tag', params.tag);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<ArticleRow[]>(`/articles${suffix}`);
  },
  getArticle: (id: number) => request<ArticleRow & { reposts: RepostRow[] }>(`/articles/${id}`),
  addTags: (id: number, tags: string[]) =>
    request<{ tags: TagRow[] }>(`/articles/${id}/tags`, { method: 'PATCH', body: JSON.stringify({ add: tags }) }),
  removeTag: (id: number, tagId: number) =>
    request<{ tags: TagRow[] }>(`/articles/${id}/tags`, { method: 'PATCH', body: JSON.stringify({ remove: [tagId] }) }),

  repost: (articleId: number, platform: string) =>
    request<RepostRow>(`/articles/${articleId}/repost`, { method: 'POST', body: JSON.stringify({ platform }) }),
  updateRepost: (id: number, input: { content?: string; published?: boolean }) =>
    request<RepostRow>(`/reposts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  listReactions: (articleId: number) => request<ReactionRow[]>(`/articles/${articleId}/reactions`),
  analyzeReactions: (articleId: number, text: string) =>
    request<{ article: ArticleRow; reactions: ReactionRow[] }>(`/articles/${articleId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  optimizeSeo: (repostId: number) => request<RepostRow>(`/reposts/${repostId}/seo`, { method: 'POST' }),
};
