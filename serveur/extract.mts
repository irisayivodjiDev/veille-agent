import { extract } from '@extractus/article-extractor';

export interface ExtractedContent {
  title: string | null;
  text: string;
}

export async function extractFromUrl(url: string): Promise<ExtractedContent> {
  const article = await extract(url);
  if (!article || !article.content) {
    throw new Error(`Impossible d'extraire le contenu de ${url}`);
  }
  const text = article.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return { title: article.title ?? null, text };
}
