import { Router } from 'express';
import { runPertinence } from '../../Agents/Pertinence/Pertinence.mts';
import { getArticle, listReactionsForArticle } from '../../db/repository.mts';

export const reactions = Router();

reactions.get('/articles/:id/reactions', (req, res) => {
  const articleId = Number(req.params.id);
  const article = getArticle(articleId);
  if (!article) {
    return res.status(404).json({ error: 'Article introuvable' });
  }
  res.json(listReactionsForArticle(articleId));
});

reactions.post('/articles/:id/reactions', async (req, res) => {
  const articleId = Number(req.params.id);
  const article = getArticle(articleId);
  if (!article) {
    return res.status(404).json({ error: 'Article introuvable' });
  }

  const text = (req.body?.text as string) || '';
  if (!text.trim()) {
    return res.status(400).json({ error: 'Fournir "text" (une réaction par ligne)' });
  }

  try {
    const result = await runPertinence(articleId, text);
    res.status(201).json(result);
  } catch (err) {
    console.error('❌ Erreur agent de pertinence:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});
