import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db.mts';
import {
  createArticle,
  createReactions,
  createRepost,
  createSource,
  deleteSource,
  getArticle,
  getArticleTags,
  getRepost,
  getSource,
  listArticles,
  listFolders,
  listReactionsForArticle,
  listRepostsForArticle,
  listSources,
  listTags,
  removeArticleTag,
  setArticleTags,
  updateArticleRelevance,
  updateRepost,
  updateRepostSeo,
  updateSourceStatus,
} from './repository.mts';

// vitest.setup.mts force APP_DB_PATH=':memory:' avant l'import de db.mts, donc
// chaque run de la suite part d'une base neuve (dossiers déjà seedés au chargement
// du module). On repart d'un état propre pour les tables qu'on manipule, entre
// chaque test, pour ne pas dépendre de l'ordre d'exécution.
beforeEach(() => {
  db.exec(
    'DELETE FROM reactions; DELETE FROM reposts; DELETE FROM article_tags; DELETE FROM articles; DELETE FROM tags; DELETE FROM sources;'
  );
});

function makeQualifiedArticle(overrides: Partial<Parameters<typeof createArticle>[0]> = {}) {
  const source = createSource({ channel: 'web', raw_type: 'text', raw_text: 'contenu de test' });
  const folder = listFolders()[0];
  const article = createArticle({
    source_id: source.id,
    title: 'Titre de test',
    summary: 'Résumé de test',
    nature: 'article',
    legitimacy_note: 'Légitime',
    why_interesting: 'Intéressant',
    augmentation_note: 'Augmente',
    category: folder.category,
    folder_id: folder.id,
    ...overrides,
  });
  return { source, article, folder };
}

describe('folders', () => {
  it('sont initialisés depuis config/folders.json au chargement du module', () => {
    const folders = listFolders();
    expect(folders.length).toBeGreaterThan(0);
    expect(folders[0]).toHaveProperty('category');
  });
});

describe('sources', () => {
  it('crée une source avec le statut pending par défaut', () => {
    const source = createSource({ channel: 'web', raw_type: 'url', raw_url: 'https://example.com' });
    expect(source.status).toBe('pending');
    expect(source.raw_url).toBe('https://example.com');
    expect(getSource(source.id)).toEqual(source);
  });

  it('liste les sources, la plus récente en premier', () => {
    createSource({ channel: 'web', raw_type: 'text', raw_text: 'une' });
    createSource({ channel: 'telegram', raw_type: 'text', raw_text: 'deux' });
    const sources = listSources();
    expect(sources).toHaveLength(2);
    expect(sources[0].raw_text).toBe('deux');
  });

  it('met à jour le statut et le message d\'erreur', () => {
    const source = createSource({ channel: 'web', raw_type: 'url', raw_url: 'https://example.com' });
    updateSourceStatus(source.id, 'error', 'oups');
    const updated = getSource(source.id)!;
    expect(updated.status).toBe('error');
    expect(updated.error_message).toBe('oups');
  });

  it('supprime une source sans article associé', () => {
    const source = createSource({ channel: 'web', raw_type: 'text', raw_text: 'brouillon' });
    deleteSource(source.id);
    expect(getSource(source.id)).toBeUndefined();
  });

  it('supprime en cascade l\'article, les tags, reposts et réactions liés', () => {
    const { source, article } = makeQualifiedArticle();
    setArticleTags(article.id, ['ia', 'automatisation'], 'ai');
    const repost = createRepost({ article_id: article.id, platform: 'linkedin', content: 'post' });
    createReactions(article.id, [{ text: 'top', sentiment: 'positive', reason: 'sympa' }]);

    deleteSource(source.id);

    expect(getSource(source.id)).toBeUndefined();
    expect(getArticle(article.id)).toBeUndefined();
    expect(getArticleTags(article.id)).toHaveLength(0);
    expect(getRepost(repost.id)).toBeUndefined();
    expect(listReactionsForArticle(article.id)).toHaveLength(0);
  });
});

describe('articles et tags', () => {
  it('crée un article rattaché à sa source et à son dossier', () => {
    const { article, source, folder } = makeQualifiedArticle();
    expect(article.source_id).toBe(source.id);
    expect(article.folder_id).toBe(folder.id);
    expect(article.relevance_score).toBe(0);
  });

  it('associe des tags avec leur origine (ai vs manual) et les liste triés', () => {
    const { article } = makeQualifiedArticle();
    setArticleTags(article.id, ['IA', 'Automatisation'], 'ai');
    setArticleTags(article.id, ['pertinence'], 'manual');

    const tags = getArticleTags(article.id);
    expect(tags.map((t) => t.name)).toEqual(['automatisation', 'ia', 'pertinence']);
    expect(tags.find((t) => t.name === 'pertinence')?.source).toBe('manual');
    expect(tags.find((t) => t.name === 'ia')?.source).toBe('ai');
  });

  it('ne duplique pas un tag déjà existant (réutilisation par nom normalisé)', () => {
    const { article } = makeQualifiedArticle();
    setArticleTags(article.id, ['IA'], 'ai');
    setArticleTags(article.id, ['ia'], 'manual');
    expect(listTags().filter((t) => t.name === 'ia')).toHaveLength(1);
  });

  it('retire un tag manuellement', () => {
    const { article } = makeQualifiedArticle();
    setArticleTags(article.id, ['ia'], 'ai');
    const [tag] = getArticleTags(article.id);
    removeArticleTag(article.id, tag.id);
    expect(getArticleTags(article.id)).toHaveLength(0);
  });

  it('filtre les articles par dossier et par tag', () => {
    const { article, folder } = makeQualifiedArticle();
    setArticleTags(article.id, ['ia'], 'ai');
    const other = makeQualifiedArticle({ title: 'Autre article' });

    expect(listArticles({ folderId: folder.id }).map((a) => a.id)).toContain(article.id);
    expect(listArticles({ tag: 'ia' }).map((a) => a.id)).toEqual([article.id]);
    expect(listArticles({ tag: 'ia' }).map((a) => a.id)).not.toContain(other.article.id);
  });
});

describe('reposts', () => {
  it('crée un repost non publié par défaut', () => {
    const { article } = makeQualifiedArticle();
    const repost = createRepost({ article_id: article.id, platform: 'linkedin', content: 'mon post' });
    expect(repost.published).toBe(0);
    expect(listRepostsForArticle(article.id)).toHaveLength(1);
  });

  it('met à jour le contenu et le statut de publication', () => {
    const { article } = makeQualifiedArticle();
    const repost = createRepost({ article_id: article.id, platform: 'linkedin', content: 'v1' });
    const updated = updateRepost(repost.id, { content: 'v2', published: true });
    expect(updated.content).toBe('v2');
    expect(updated.published).toBe(1);
  });

  it('enregistre les métadonnées SEO sans toucher au contenu', () => {
    const { article } = makeQualifiedArticle();
    const repost = createRepost({ article_id: article.id, platform: 'blog', content: 'contenu original' });
    const updated = updateRepostSeo(repost.id, {
      seo_title: 'Titre SEO',
      seo_description: 'Description SEO',
      seo_keywords: ['ia', 'veille'],
    });
    expect(updated.content).toBe('contenu original');
    expect(updated.seo_title).toBe('Titre SEO');
    expect(updated.seo_keywords).toBe('ia, veille');
  });
});

describe('agent de pertinence (réactions)', () => {
  it('enregistre des réactions et met à jour le score/la synthèse de l\'article', () => {
    const { article } = makeQualifiedArticle();
    createReactions(article.id, [
      { text: 'super article', sentiment: 'positive', reason: 'clair' },
      { text: 'pas convaincu', sentiment: 'negative', reason: 'trop vague' },
    ]);
    expect(listReactionsForArticle(article.id)).toHaveLength(2);

    const updated = updateArticleRelevance(article.id, { relevance_score: 0.6, mood_summary: 'Accueil mitigé' });
    expect(updated.relevance_score).toBe(0.6);
    expect(updated.mood_summary).toBe('Accueil mitigé');
  });
});
