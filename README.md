# Agent IA de veille technologique — Orastay

Agent IA capable de faire de la veille : capter des sources, les qualifier et
les ranger automatiquement, les stocker, puis restituer les données avec une
valeur ajoutée (republication, pertinence, SEO).

## Stack

- **Agents** : LangChain / LangGraph
- **LLM** : LM Studio en local (modèle configurable via `.env`)
- **Stockage** : SQLite (`better-sqlite3`) — modèle Source → Article → Tags
- **Backend** : Express (TypeScript, exécuté avec `tsx`)
- **Frontend** : React + Vite + Tailwind CSS

## Démarrage

### 1. LM Studio

Charger un modèle de chat dans LM Studio et démarrer son "Local Server"
(onglet Developer) sur `http://localhost:1234`.

### 2. Backend

```bash
cp .env.example .env   # remplir TELEGRAM_BOT_TOKEN si besoin
npm install
npm run server           # http://localhost:8080
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Fonctionnement

1. **Capter** — formulaire web ou bot Telegram → crée une Source brute.
2. **Qualifier & ranger** — l'agent `Agents/Qualifier` extrait le contenu
   (scraping si c'est une URL), le qualifie via le LLM local (résumé,
   légitimité, catégorie, sortie JSON validée par schéma), puis le range
   dans un dossier et lui attribue des tags. Le tout est stocké en SQLite.
3. **Republier** — l'agent `Agents/Republisher` génère un post à valeur
   ajoutée dans la voix de marque définie dans `config/brand.md`.
4. **Bonus** — agent de pertinence sur les réactions (`Agents/Pertinence`),
   optimisation SEO des posts republiés (`Agents/SEO`).

Toutes les données sont ensuite consultables, filtrables et éditables depuis
le frontend.

## Modèle de données

`Source → Article → Tags` (many-to-many), `Folder`, `Repost`, `Reaction`.
Détail dans `db/schema.sql`.

## Tests

```bash
npm test
```

Tests unitaires (Vitest) sur la couche de stockage, exécutés sur une base
SQLite en RAM.

## Structure du projet

```
Agents/     agents LangGraph (Qualifier, Republisher, Pertinence, SEO)
db/         schéma SQLite + accès aux données
serveur/    API Express + bot Telegram
frontend/   interface React
config/     dossiers pré-définis + identité de marque
```

Le dépôt inclut aussi le squelette CLI/agent fourni en cours (`Agents/Agent`,
`CLI/`, `Exercices/`), repris pour le petit chatbot de démo sur la page
d'accueil du frontend.
