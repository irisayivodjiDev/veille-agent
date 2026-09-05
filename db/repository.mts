import { db } from './db.mts';

export type Channel = 'telegram' | 'web' | 'dictaphone';
export type RawType = 'url' | 'text' | 'audio';
export type SourceStatus = 'pending' | 'processed' | 'rejected' | 'error';
export type Category = 'metier' | 'pro' | 'perso' | 'culture';
export type TagOrigin = 'ai' | 'manual';
export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface SourceRow {
  id: number;
  channel: Channel;
  raw_type: RawType;
  raw_url: string | null;
  raw_text: string | null;
  transcript: string | null;
  status: SourceStatus;
  captured_at: string;
  error_message: string | null;
}

export interface FolderRow {
  id: number;
  name: string;
  category: Category;
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
  category: Category;
  folder_id: number | null;
  qualified_at: string;
  relevance_score: number;
  mood_summary: string | null;
  image_url: string | null;
}

export interface TagRow {
  id: number;
  name: string;
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
  sentiment: Sentiment;
  reason: string;
  collected_at: string;
}

// ---- Sources ----

export function createSource(input: {
  channel: Channel;
  raw_type: RawType;
  raw_url?: string;
  raw_text?: string;
  transcript?: string;
}): SourceRow {
  const stmt = db.prepare(`
    INSERT INTO sources (channel, raw_type, raw_url, raw_text, transcript, status, captured_at)
    VALUES (@channel, @raw_type, @raw_url, @raw_text, @transcript, 'pending', @captured_at)
  `);
  const captured_at = new Date().toISOString();
  const result = stmt.run({
    channel: input.channel,
    raw_type: input.raw_type,
    raw_url: input.raw_url ?? null,
    raw_text: input.raw_text ?? null,
    transcript: input.transcript ?? null,
    captured_at,
  });
  return getSource(result.lastInsertRowid as number)!;
}

export function getSource(id: number): SourceRow | undefined {
  return db.prepare('SELECT * FROM sources WHERE id = ?').get(id) as SourceRow | undefined;
}

export function listSources(): SourceRow[] {
  return db.prepare('SELECT * FROM sources ORDER BY captured_at DESC, id DESC').all() as SourceRow[];
}

export function updateSourceStatus(id: number, status: SourceStatus, error_message?: string) {
  db.prepare('UPDATE sources SET status = ?, error_message = ? WHERE id = ?').run(
    status,
    error_message ?? null,
    id
  );
}

// Supprime une source et, si elle a déjà été qualifiée, l'article dérivé
// et tout ce qui en dépend (tags, reposts, réactions) pour ne pas laisser
// de lignes orphelines.
export function deleteSource(id: number) {
  const tx = db.transaction(() => {
    const article = db.prepare('SELECT id FROM articles WHERE source_id = ?').get(id) as
      | { id: number }
      | undefined;
    if (article) {
      db.prepare('DELETE FROM article_tags WHERE article_id = ?').run(article.id);
      db.prepare('DELETE FROM reposts WHERE article_id = ?').run(article.id);
      db.prepare('DELETE FROM reactions WHERE article_id = ?').run(article.id);
      db.prepare('DELETE FROM articles WHERE id = ?').run(article.id);
    }
    db.prepare('DELETE FROM sources WHERE id = ?').run(id);
  });
  tx();
}

// ---- Folders ----

export function listFolders(): FolderRow[] {
  return db.prepare('SELECT * FROM folders ORDER BY category, name').all() as FolderRow[];
}

export function getFolderByName(name: string): FolderRow | undefined {
  return db.prepare('SELECT * FROM folders WHERE name = ?').get(name) as FolderRow | undefined;
}

// ---- Tags ----

export function listTags(): TagRow[] {
  return db.prepare('SELECT * FROM tags ORDER BY name').all() as TagRow[];
}

export function getOrCreateTag(name: string): TagRow {
  const normalized = name.trim().toLowerCase();
  const existing = db.prepare('SELECT * FROM tags WHERE name = ?').get(normalized) as TagRow | undefined;
  if (existing) return existing;
  const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(normalized);
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid) as TagRow;
}

// ---- Articles ----

export function createArticle(input: {
  source_id: number;
  title: string;
  summary: string;
  nature: string;
  legitimacy_note: string;
  why_interesting: string;
  augmentation_note: string;
  category: Category;
  folder_id: number | null;
  image_url?: string | null;
}): ArticleRow {
  const stmt = db.prepare(`
    INSERT INTO articles
      (source_id, title, summary, nature, legitimacy_note, why_interesting, augmentation_note, category, folder_id, qualified_at, image_url)
    VALUES
      (@source_id, @title, @summary, @nature, @legitimacy_note, @why_interesting, @augmentation_note, @category, @folder_id, @qualified_at, @image_url)
  `);
  const result = stmt.run({
    ...input,
    image_url: input.image_url ?? null,
    qualified_at: new Date().toISOString(),
  });
  return getArticle(result.lastInsertRowid as number)!;
}

export function getArticle(id: number): ArticleRow | undefined {
  return db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as ArticleRow | undefined;
}

export function listArticles(filters: { folderId?: number; tag?: string } = {}): ArticleRow[] {
  if (filters.tag) {
    return db
      .prepare(
        `SELECT a.* FROM articles a
         JOIN article_tags at ON at.article_id = a.id
         JOIN tags t ON t.id = at.tag_id
         WHERE t.name = ?
         ORDER BY a.qualified_at DESC, a.id DESC`
      )
      .all(filters.tag.trim().toLowerCase()) as ArticleRow[];
  }
  if (filters.folderId) {
    return db
      .prepare('SELECT * FROM articles WHERE folder_id = ? ORDER BY qualified_at DESC, id DESC')
      .all(filters.folderId) as ArticleRow[];
  }
  return db.prepare('SELECT * FROM articles ORDER BY qualified_at DESC, id DESC').all() as ArticleRow[];
}

export function setArticleTags(articleId: number, tagNames: string[], origin: TagOrigin) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO article_tags (article_id, tag_id, source) VALUES (?, ?, ?)'
  );
  const tx = db.transaction((names: string[]) => {
    for (const name of names) {
      const tag = getOrCreateTag(name);
      insert.run(articleId, tag.id, origin);
    }
  });
  tx(tagNames);
}

export function removeArticleTag(articleId: number, tagId: number) {
  db.prepare('DELETE FROM article_tags WHERE article_id = ? AND tag_id = ?').run(articleId, tagId);
}

export function getArticleTags(articleId: number): (TagRow & { source: TagOrigin })[] {
  return db
    .prepare(
      `SELECT t.*, at.source as source FROM tags t
       JOIN article_tags at ON at.tag_id = t.id
       WHERE at.article_id = ?
       ORDER BY t.name`
    )
    .all(articleId) as (TagRow & { source: TagOrigin })[];
}

// ---- Reposts ----

export function createRepost(input: { article_id: number; platform: string; content: string }): RepostRow {
  const stmt = db.prepare(`
    INSERT INTO reposts (article_id, platform, content, created_at, published)
    VALUES (@article_id, @platform, @content, @created_at, 0)
  `);
  const result = stmt.run({ ...input, created_at: new Date().toISOString() });
  return db.prepare('SELECT * FROM reposts WHERE id = ?').get(result.lastInsertRowid) as RepostRow;
}

export function listRepostsForArticle(articleId: number): RepostRow[] {
  return db
    .prepare('SELECT * FROM reposts WHERE article_id = ? ORDER BY created_at DESC, id DESC')
    .all(articleId) as RepostRow[];
}

export function getRepost(id: number): RepostRow | undefined {
  return db.prepare('SELECT * FROM reposts WHERE id = ?').get(id) as RepostRow | undefined;
}

export function updateRepost(id: number, input: { content?: string; published?: boolean }): RepostRow {
  const current = db.prepare('SELECT * FROM reposts WHERE id = ?').get(id) as RepostRow;
  const content = input.content ?? current.content;
  const published = input.published === undefined ? current.published : input.published ? 1 : 0;
  db.prepare('UPDATE reposts SET content = ?, published = ? WHERE id = ?').run(content, published, id);
  return db.prepare('SELECT * FROM reposts WHERE id = ?').get(id) as RepostRow;
}

export function updateRepostSeo(
  id: number,
  input: { seo_title: string; seo_description: string; seo_keywords: string[] }
): RepostRow {
  db.prepare('UPDATE reposts SET seo_title = ?, seo_description = ?, seo_keywords = ? WHERE id = ?').run(
    input.seo_title,
    input.seo_description,
    input.seo_keywords.join(', '),
    id
  );
  return db.prepare('SELECT * FROM reposts WHERE id = ?').get(id) as RepostRow;
}

// ---- Réactions (agent de pertinence) ----

export function createReactions(
  articleId: number,
  reactions: { text: string; sentiment: Sentiment; reason: string }[]
): ReactionRow[] {
  const insert = db.prepare(`
    INSERT INTO reactions (article_id, text, sentiment, reason, collected_at)
    VALUES (@article_id, @text, @sentiment, @reason, @collected_at)
  `);
  const collected_at = new Date().toISOString();
  const tx = db.transaction((rows: typeof reactions) => {
    for (const row of rows) {
      insert.run({ article_id: articleId, collected_at, ...row });
    }
  });
  tx(reactions);
  return listReactionsForArticle(articleId);
}

export function listReactionsForArticle(articleId: number): ReactionRow[] {
  return db
    .prepare('SELECT * FROM reactions WHERE article_id = ? ORDER BY collected_at DESC, id DESC')
    .all(articleId) as ReactionRow[];
}

export function updateArticleRelevance(
  articleId: number,
  input: { relevance_score: number; mood_summary: string }
): ArticleRow {
  db.prepare('UPDATE articles SET relevance_score = ?, mood_summary = ? WHERE id = ?').run(
    input.relevance_score,
    input.mood_summary,
    articleId
  );
  return getArticle(articleId)!;
}
