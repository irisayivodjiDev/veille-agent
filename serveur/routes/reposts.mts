import { Router } from 'express';
import { runRepublisher } from '../../Agents/Republisher/Republisher.mts';
import { runSeoOptimizer } from '../../Agents/SEO/SEO.mts';
import { createRepost, getArticle, getRepost, updateRepost } from '../../db/repository.mts';

export const reposts = Router();

reposts.post('/articles/:id/repost', async (req, res) => {
  const articleId = Number(req.params.id);
  const article = getArticle(articleId);
  if (!article) {
    return res.status(404).json({ error: 'Article introuvable' });
  }

  const platform = (req.body?.platform as string) || 'linkedin';

  try {
    const content = await runRepublisher(articleId, platform);
    const repost = createRepost({ article_id: articleId, platform, content });
    res.status(201).json(repost);
  } catch (err) {
    console.error('❌ Erreur Republisher:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

reposts.patch('/reposts/:id', (req, res) => {
  const id = Number(req.params.id);
  const { content, published } = req.body as { content?: string; published?: boolean };
  const repost = updateRepost(id, { content, published });
  res.json(repost);
});

reposts.post('/reposts/:id/seo', async (req, res) => {
  const id = Number(req.params.id);
  const repost = getRepost(id);
  if (!repost) {
    return res.status(404).json({ error: 'Repost introuvable' });
  }

  try {
    const updated = await runSeoOptimizer(id);
    res.json(updated);
  } catch (err) {
    console.error('❌ Erreur agent SEO:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});
