import Database from 'better-sqlite3';
import 'dotenv/config';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const dbPath = process.env.APP_DB_PATH || 'state_db/veille.db';
const fullDbPath = join(projectRoot, dbPath);

fs.mkdirSync(dirname(fullDbPath), { recursive: true });

export const db = new Database(fullDbPath);
db.pragma('journal_mode = WAL');

const schema = fs.readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// CREATE TABLE IF NOT EXISTS ne modifie pas une table deja existante : sur une
// base creee avant l'ajout de l'agent de pertinence, ces colonnes manquent
// encore. On les ajoute ici si besoin, une seule fois.
function migrateArticlesColumns() {
  const columns = db.prepare('PRAGMA table_info(articles)').all() as { name: string }[];
  const names = new Set(columns.map((c) => c.name));

  if (!names.has('relevance_score')) {
    db.exec('ALTER TABLE articles ADD COLUMN relevance_score REAL NOT NULL DEFAULT 0');
    console.log('✅ Migration: colonne articles.relevance_score ajoutée');
  }
  if (!names.has('mood_summary')) {
    db.exec('ALTER TABLE articles ADD COLUMN mood_summary TEXT');
    console.log('✅ Migration: colonne articles.mood_summary ajoutée');
  }
}

migrateArticlesColumns();

function seedFolders() {
  const count = (db.prepare('SELECT COUNT(*) as n FROM folders').get() as { n: number }).n;
  if (count > 0) return;

  const foldersPath = join(projectRoot, 'config', 'folders.json');
  const folders: { name: string; category: string }[] = JSON.parse(fs.readFileSync(foldersPath, 'utf-8'));

  const insert = db.prepare('INSERT INTO folders (name, category) VALUES (?, ?)');
  const insertMany = db.transaction((rows: typeof folders) => {
    for (const row of rows) insert.run(row.name, row.category);
  });
  insertMany(folders);

  console.log(`✅ ${folders.length} dossier(s) initialisé(s) depuis config/folders.json`);
}

seedFolders();
