import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getArticle, getArticleTags } from '../../db/repository.mts';
import { getChatModel } from '../llm.mts';
import { fillTemplate } from '../parseJson.mts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const promptTemplate = fs.readFileSync(join(__dirname, 'prompt.md'), 'utf-8');

const llm = getChatModel(0.7);

export async function runRepublisher(articleId: number, platform: string): Promise<string> {
  const article = getArticle(articleId);
  if (!article) {
    throw new Error(`Article ${articleId} introuvable`);
  }

  const brand = fs.readFileSync(join(projectRoot, 'config', 'brand.md'), 'utf-8');
  const tags = getArticleTags(articleId).map((t) => t.name);

  const prompt = fillTemplate(promptTemplate, {
    brand,
    title: article.title,
    summary: article.summary,
    whyInteresting: article.why_interesting,
    augmentationNote: article.augmentation_note,
    tags: tags.join(', '),
    platform,
  });

  const response = await llm.invoke(prompt);
  return typeof response.content === 'string' ? response.content.trim() : JSON.stringify(response.content);
}
