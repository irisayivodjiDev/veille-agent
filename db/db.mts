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
