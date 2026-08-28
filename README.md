# 🤖 Agent CLI & Server

Un CLI et serveur JavaScript/TypeScript pour tester et interagir avec des agents IA.

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Copier et configurer les variables d'environnement
cp .env.example .env
```

## 🚀 Démarrage rapide

### 1. Démarrer le serveur

```bash
# Démarrer le serveur en mode production
npm run server

# Ou en mode développement avec rechargement automatique
npm run dev
```

Le serveur sera accessible sur `http://localhost:8080`

### 2. Utiliser le CLI

```bash
# Vérifier la connectivité et lister les agents
npm run cli check

# Démarrer une session de chat
npm run cli chat

# Utiliser un agent spécifique
npm run cli chat --agent sallyO

# Mode invoke au lieu de streaming
npm run cli chat --invoke

# Mode debug
npm run cli chat --debug
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` avec les variables suivantes :

```env
# Configuration API
API_URL=http://localhost:8080
PORT=8080

# Authentification (optionnelle)
BEARER_TOKEN=votre-token-ici
REQUIRE_AUTH=false

# Clés API pour les agents réels
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
```

### Configuration des agents

Modifiez le fichier `agents_config.json` pour configurer vos agents :

```json
{
  "api_url": "http://localhost:8080",
  "agents": [
    {
      "id": "sallyO",
      "name": "SallyO",
      "description": "Un agent IA spécialisé dans les opportunités CRM"
    }
  ]
}
```

## 📡 Endpoints API

### Vérification de santé
```http
GET /health
```

### Liste des agents
```http
GET /agents
Authorization: Bearer your-token
```

### Invocation directe
```http
POST /:agentId/invoke
Authorization: Bearer your-token
Content-Type: application/json

{
  "message": "Votre message",
  "thread_id": "optional-thread-id"
}
```

### Streaming SSE
```http
POST /:agentId/stream
Authorization: Bearer your-token
Content-Type: application/json

{
  "message": "Votre message",
  "thread_id": "optional-thread-id"
}
```

### Arrêter la génération
```http
POST /:agentId/stop
Authorization: Bearer your-token
Content-Type: application/json

{
  "thread_id": "thread-id-to-stop"
}
```

### Gestion des conversations
```http
GET /conversations
GET /conversations/:threadId
Authorization: Bearer your-token
```

## 💬 Utilisation du CLI

### Commandes spéciales pendant le chat

- `!clear` - Réinitialiser la conversation
- `!debug` - Basculer le mode debug
- `exit` - Quitter le chat

### Options de ligne de commande

```bash
# Commande check
npm run cli check [options]
  --api-url <url>        URL de l'API
  --bearer-token <token> Token d'authentification
  -d, --debug           Mode debug

# Commande chat
npm run cli chat [options]
  -a, --agent <id>       ID de l'agent
  -i, --invoke          Mode invoke (pas de streaming)
  --api-url <url>        URL de l'API
  --bearer-token <token> Token d'authentification
  -d, --debug           Mode debug
  --no-context          Désactiver le contexte
```

## 🔄 Streaming et événements SSE

Le serveur supporte les Server-Sent Events avec les types d'événements suivants :

- `stream_start` - Début du streaming
- `stream_token` - Token de réponse
- `stream_end` - Fin du streaming
- `tool_execution_start` - Début d'utilisation d'outil
- `tool_execution_complete` - Fin d'utilisation d'outil
- `tool_execution_error` - Erreur d'outil
- `error` - Erreur générale

## 🛠️ Développement

### Structure du projet

```
agent-example/
├── Agents/Agent/Agent.mts  # Agent LangChain
├── CLI/cli.mts            # CLI pour tester les agents
├── serveur/server.mts     # Serveur Express.js
├── CLI/agents_config.json # Configuration des agents
├── package.json           # Dépendances et scripts
└── README.md              # Documentation
```

### Scripts disponibles

```bash
npm run cli      # Lancer le CLI
npm run server   # Démarrer le serveur
npm run dev      # Mode développement avec rechargement
```

### Intégration avec de vrais agents

Pour remplacer le `MockAgent` par de vrais agents :

1. Modifiez la classe `MockAgent` dans `server.mts`
2. Intégrez avec LangChain, OpenAI, ou votre framework préféré
3. Adaptez les méthodes `generateResponse` et `invokeResponse`

## 🔐 Sécurité

- L'authentification par token Bearer est optionnelle (configurable)
- Les tokens sont stockés en mémoire côté serveur
- Les conversations sont en mémoire (remplacer par une DB en production)
- CORS configuré pour accepter toutes les origines (à restreindre en production)

## 📝 Exemples d'utilisation

### Test rapide

```bash
# Terminal 1 - Démarrer le serveur
npm run server

# Terminal 2 - Tester la connectivité
npm run cli check

# Terminal 3 - Commencer à chatter
npm run cli chat
```

### Avec authentification

```bash
# Avec token dans .env
BEARER_TOKEN=mon-super-token npm run server

# Utiliser le même token dans le CLI
npm run cli chat --bearer-token mon-super-token
```

### Mode debug

```bash
# Voir tous les détails des requêtes
npm run cli chat --debug
```

## 🚨 Limitations actuelles

- Agents simulés (MockAgent)
- Stockage en mémoire uniquement
- Pas de persistance des conversations
- Authentification basique
- Pas de rate limiting

## 🎯 Prochaines étapes

- [ ] Intégration avec de vrais agents LangChain
- [ ] Base de données pour la persistance
- [ ] Authentification robuste
- [ ] Rate limiting
- [ ] Interface web
- [ ] Docker
- [ ] Tests automatisés

## 📄 Licence

MIT

---

🚀 **Prêt à discuter avec vos agents IA !**
