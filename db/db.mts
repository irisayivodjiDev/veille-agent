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
// base creee avant l'ajout d'une fonctionnalite, les nouvelles colonnes
// manquent encore. On les ajoute ici si besoin, une seule fois.
function addColumnIfMissing(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (columns.some((c) => c.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  console.log(`✅ Migration: colonne ${table}.${column} ajoutée`);
}

addColumnIfMissing('articles', 'relevance_score', 'REAL NOT NULL DEFAULT 0');
addColumnIfMissing('articles', 'mood_summary', 'TEXT');
addColumnIfMissing('reposts', 'seo_title', 'TEXT');
addColumnIfMissing('reposts', 'seo_description', 'TEXT');
addColumnIfMissing('reposts', 'seo_keywords', 'TEXT');
addColumnIfMissing('articles', 'image_url', 'TEXT');

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
