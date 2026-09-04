CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK(category IN ('metier','pro','perso','culture'))
);

CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel TEXT NOT NULL,
  raw_type TEXT NOT NULL,
  raw_url TEXT,
  raw_text TEXT,
  transcript TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  captured_at TEXT NOT NULL,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL REFERENCES sources(id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  nature TEXT NOT NULL,
  legitimacy_note TEXT NOT NULL,
  why_interesting TEXT NOT NULL,
  augmentation_note TEXT NOT NULL,
  category TEXT NOT NULL,
  folder_id INTEGER REFERENCES folders(id),
  qualified_at TEXT NOT NULL,
  relevance_score REAL NOT NULL DEFAULT 0,
  mood_summary TEXT,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER NOT NULL REFERENCES articles(id),
  tag_id INTEGER NOT NULL REFERENCES tags(id),
  source TEXT NOT NULL DEFAULT 'ai',
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS reposts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES articles(id),
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT
);

CREATE TABLE IF NOT EXISTS reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES articles(id),
  text TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK(sentiment IN ('positive','negative','neutral')),
  reason TEXT NOT NULL,
  collected_at TEXT NOT NULL
);
