import { Router } from 'express';
import {
  getArticle,
  getArticleTags,
  listArticles,
  listFolders,
  listRepostsForArticle,
  removeArticleTag,
  setArticleTags,
} from '../../db/repository.mts';

export const articlesRouter = Router();

function serializeArticle(id: number) {
  const article = getArticle(id);
  if (!article) return null;
  const folders = listFolders();
  const folder = folders.find((f) => f.id === article.folder_id) ?? null;
  return {
    ...article,
    folder,
    tags: getArticleTags(id),
  };
}

articlesRouter.get('/', (req, res) => {
  const folderId = req.query.folderId ? Number(req.query.folderId) : undefined;
  const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;

  const rows = listArticles({ folderId, tag });
  res.json(rows.map((row) => serializeArticle(row.id)));
});

articlesRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const article = serializeArticle(id);
  if (!article) {
    return res.status(404).json({ error: 'Article introuvable' });
  }
  res.json({ ...article, reposts: listRepostsForArticle(id) });
});

articlesRouter.patch('/:id/tags', (req, res) => {
  const id = Number(req.params.id);
  const article = getArticle(id);
  if (!article) {
    return res.status(404).json({ error: 'Article introuvable' });
  }

  const { add, remove } = req.body as { add?: string[]; remove?: number[] };

  if (add && add.length) {
    setArticleTags(id, add, 'manual');
  }
  if (remove && remove.length) {
    for (const tagId of remove) {
      removeArticleTag(id, tagId);
    }
  }

  res.json({ tags: getArticleTags(id) });
});
