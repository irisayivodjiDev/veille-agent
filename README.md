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

## Déploiement (Vercel + Render)

Le frontend statique peut être déployé sur Vercel. L'API Express, le bot
Telegram et SQLite ont besoin d'un processus persistant et d'un disque durable :
le fichier `render.yaml` configure un service Render avec un disque persistant.

1. Sur Render, crée un Blueprint depuis le dépôt et valide la configuration de
   `render.yaml`. Le plan Starter est nécessaire pour le disque persistant.
2. Dans les variables du service Render, configure `GOOGLE_API_KEY` pour utiliser
   le modèle Gemini en production. Ajoute `TELEGRAM_BOT_TOKEN` si le bot doit
   fonctionner. LM Studio sur `localhost` ne sera pas accessible depuis Render.
3. Sur Vercel, importe le dépôt et choisis `frontend` comme **Root Directory**.
   Utilise `npm run build` et `dist` comme dossier de sortie.
4. Dans les variables d'environnement Vercel, définis
   `VITE_API_BASE_URL` avec l'URL HTTPS du service Render (par exemple
   `https://mon-api.onrender.com`), puis redéploie le frontend.

Le frontend utilise une URL relative en développement et `VITE_API_BASE_URL`
en production. L'API doit rester en ligne pour que le site fonctionne.

**Sécurité :** l'API actuelle n'authentifie pas les routes de veille, qui seront
donc accessibles publiquement une fois déployées. N'y mets pas de données
sensibles et ajoute une authentification ainsi que des limites de requêtes avant
un usage public en production. Le chat nécessite également `REQUIRE_AUTH=false`
avec le frontend actuel ; ne déploie pas le chat publiquement sans le sécuriser.

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
