import { Router } from 'express';
import { runQualifier } from '../../Agents/Qualifier/Qualifier.mts';
import { createSource, listSources } from '../../db/repository.mts';

export const sourcesRouter = Router();

sourcesRouter.get('/', (_req, res) => {
  res.json(listSources());
});

sourcesRouter.post('/', (req, res) => {
  const { url, text } = req.body as { url?: string; text?: string };

  if (!url && !text) {
    return res.status(400).json({ error: 'Fournir "url" ou "text"' });
  }

  const source = url
    ? createSource({ channel: 'web', raw_type: 'url', raw_url: url })
    : createSource({ channel: 'web', raw_type: 'text', raw_text: text });

  res.status(201).json(source);
});

sourcesRouter.post('/:id/process', async (req, res) => {
  const sourceId = Number(req.params.id);
  if (Number.isNaN(sourceId)) {
    return res.status(400).json({ error: 'id invalide' });
  }

  try {
    const result = await runQualifier(sourceId);
    if (result.error) {
      return res.status(422).json({ error: result.error });
    }
    res.json({ articleId: result.articleId });
  } catch (err) {
    console.error('❌ Erreur pipeline Qualifier:', err);
    res.status(500).json({ error: (err as Error).message });
  }
});
