import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getArticle, getArticleTags, getRepost, updateRepostSeo } from '../../db/repository.mts';
import { getChatModel } from '../llm.mts';
import { callStructuredLlm, fillTemplate } from '../parseJson.mts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const promptTemplate = fs.readFileSync(join(__dirname, 'prompt.md'), 'utf-8');

const llm = getChatModel(0.3);

interface SeoResult {
  seo_title: string;
  seo_description: string;
  seo_keywords: string[];
}

const SEO_SCHEMA = {
  type: 'object',
  properties: {
    seo_title: { type: 'string' },
    seo_description: { type: 'string' },
    seo_keywords: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 8 },
  },
  required: ['seo_title', 'seo_description', 'seo_keywords'],
  additionalProperties: false,
};

export async function runSeoOptimizer(repostId: number) {
  const repost = getRepost(repostId);
  if (!repost) {
    throw new Error(`Repost ${repostId} introuvable`);
  }

  const article = getArticle(repost.article_id);
  if (!article) {
    throw new Error(`Article ${repost.article_id} introuvable`);
  }

  const tags = getArticleTags(article.id).map((t) => t.name);

  const prompt = fillTemplate(promptTemplate, {
    platform: repost.platform,
    articleTitle: article.title,
    tags: tags.join(', '),
    content: repost.content,
  });

  const result = await callStructuredLlm<SeoResult>(llm, prompt, 'seo_optimization', SEO_SCHEMA);

  // Le modele ne respecte pas toujours les longueurs demandees dans le prompt :
  // on tronque proprement plutot que de stocker un titre/description hors gabarit.
  const truncate = (text: string, max: number) =>
    text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

  return updateRepostSeo(repostId, {
    seo_title: truncate(result.seo_title, 60),
    seo_description: truncate(result.seo_description, 160),
    seo_keywords: result.seo_keywords,
  });
}
