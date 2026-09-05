// Base de données en RAM pour les tests : chaque fichier de test obtient sa
// propre instance (isolation via le cache de modules de chaque worker Vitest),
// jamais le fichier state_db/veille.db utilisé en développement.
process.env.APP_DB_PATH = ':memory:';
