import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  createReactions,
  getArticle,
  listReactionsForArticle,
  updateArticleRelevance,
  type Sentiment,
} from '../../db/repository.mts';
import { getChatModel } from '../llm.mts';
import { callStructuredLlm, fillTemplate } from '../parseJson.mts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const classifyPromptTemplate = fs.readFileSync(join(__dirname, 'classify-prompt.md'), 'utf-8');
const synthesizePromptTemplate = fs.readFileSync(join(__dirname, 'synthesize-prompt.md'), 'utf-8');

const llm = getChatModel(0.3);

interface Classification {
  comment: string;
  sentiment: Sentiment;
  reason: string;
}

interface ClassificationBatch {
  classifications: Classification[];
}

interface Synthesis {
  mood_summary: string;
  relevance_score: number;
}

function splitComments(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function classifyComments(comments: string[]): Promise<Classification[]> {
  const prompt = fillTemplate(classifyPromptTemplate, {
    count: String(comments.length),
    comments: comments.map((c, i) => `${i + 1}. ${c}`).join('\n'),
  });

  const schema = {
    type: 'object',
    properties: {
      classifications: {
        type: 'array',
        minItems: comments.length,
        maxItems: comments.length,
        items: {
          type: 'object',
          properties: {
            comment: { type: 'string' },
            sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
            reason: { type: 'string' },
          },
          required: ['comment', 'sentiment', 'reason'],
          additionalProperties: false,
        },
      },
    },
    required: ['classifications'],
    additionalProperties: false,
  };

  const result = await callStructuredLlm<ClassificationBatch>(llm, prompt, 'classifications', schema);
  return result.classifications;
}

async function synthesizeMood(
  article: { title: string; summary: string },
  reactions: { text: string; sentiment: Sentiment; reason: string }[]
): Promise<Synthesis> {
  const prompt = fillTemplate(synthesizePromptTemplate, {
    title: article.title,
    summary: article.summary,
    reactions: reactions.map((r) => `- [${r.sentiment}] "${r.text}" — ${r.reason}`).join('\n'),
  });

  const schema = {
    type: 'object',
    properties: {
      mood_summary: { type: 'string' },
      relevance_score: { type: 'number', minimum: 0, maximum: 1 },
    },
    required: ['mood_summary', 'relevance_score'],
    additionalProperties: false,
  };

  return callStructuredLlm<Synthesis>(llm, prompt, 'synthesis', schema);
}

export async function runPertinence(articleId: number, rawText: string) {
  const article = getArticle(articleId);
  if (!article) {
    throw new Error(`Article ${articleId} introuvable`);
  }

  const comments = splitComments(rawText);
  if (comments.length === 0) {
    throw new Error('Aucun commentaire à analyser (une ligne = un commentaire)');
  }

  const classifications = await classifyComments(comments);

  // Le modèle recopie chaque commentaire avant de le classer : on s'en sert pour
  // ré-aligner par correspondance de texte (plus robuste qu'un simple index si
  // l'ordre ou le nombre d'éléments dérape un peu).
  const remaining = [...classifications];
  const paired = comments.map((text) => {
    const matchIndex = remaining.findIndex((c) => c.comment.trim() === text.trim());
    const match = matchIndex !== -1 ? remaining.splice(matchIndex, 1)[0] : remaining.shift();
    return {
      text,
      sentiment: match?.sentiment ?? ('neutral' as Sentiment),
      reason: match?.reason ?? 'Non classé automatiquement (réponse du modèle incomplète).',
    };
  });

  createReactions(articleId, paired);

  const allReactions = listReactionsForArticle(articleId);
  const synthesis = await synthesizeMood(article, allReactions);
  const clampedScore = Math.min(1, Math.max(0, synthesis.relevance_score));

  const updatedArticle = updateArticleRelevance(articleId, {
    relevance_score: clampedScore,
    mood_summary: synthesis.mood_summary,
  });

  return { article: updatedArticle, reactions: allReactions };
}
