import { END, START, StateGraph } from '@langchain/langgraph';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  type Category,
  createArticle,
  getSource,
  listFolders,
  listTags,
  setArticleTags,
  updateSourceStatus,
} from '../../db/repository.mts';
import { extractFromUrl } from '../../serveur/extract.mts';
import { getChatModel } from '../llm.mts';
import { callStructuredLlm, fillTemplate } from '../parseJson.mts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const qualifyPromptTemplate = fs.readFileSync(join(__dirname, 'prompt.md'), 'utf-8');
const rankPromptTemplate = fs.readFileSync(join(__dirname, 'rank-prompt.md'), 'utf-8');

const llm = getChatModel(0.3);

interface Qualification {
  title: string;
  summary: string;
  nature: string;
  legitimacy_note: string;
  why_interesting: string;
  augmentation_note: string;
  category: Category;
}

interface Ranking {
  folder: string;
  tags: string[];
}

type QualifierState = {
  sourceId: number;
  extractedTitle: string | null;
  extractedText: string;
  extractedImageUrl: string | null;
  qualification: Qualification | null;
  ranking: Ranking | null;
  articleId: number | null;
  error: string | null;
};

const overwrite = <T,>(_current: T, update: T) => update;

async function extractNode(state: QualifierState): Promise<Partial<QualifierState>> {
  const source = getSource(state.sourceId);
  if (!source) {
    return { error: `Source ${state.sourceId} introuvable` };
  }

  try {
    if (source.raw_type === 'url' && source.raw_url) {
      const { title, text, imageUrl } = await extractFromUrl(source.raw_url);
      return { extractedTitle: title, extractedText: text, extractedImageUrl: imageUrl };
    }
    const text = source.transcript || source.raw_text || '';
    if (!text.trim()) {
      return { error: "Source vide : rien à qualifier" };
    }
    return { extractedTitle: null, extractedText: text, extractedImageUrl: null };
  } catch (err) {
    return { error: `Extraction impossible : ${(err as Error).message}` };
  }
}

const ALLOWED_CATEGORIES: Category[] = ['metier', 'pro', 'perso', 'culture'];

const QUALIFICATION_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    nature: { type: 'string', enum: ['video', 'article', 'post_reseau_social', 'autre'] },
    legitimacy_note: { type: 'string' },
    why_interesting: { type: 'string' },
    augmentation_note: { type: 'string' },
    category: { type: 'string', enum: ALLOWED_CATEGORIES },
  },
  required: [
    'title',
    'summary',
    'nature',
    'legitimacy_note',
    'why_interesting',
    'augmentation_note',
    'category',
  ],
  additionalProperties: false,
};

async function qualifyNode(state: QualifierState): Promise<Partial<QualifierState>> {
  if (state.error) return {};

  const prompt = fillTemplate(qualifyPromptTemplate, {
    title: state.extractedTitle ?? '',
    content: state.extractedText.slice(0, 8000),
  });

  try {
    const qualification = await callStructuredLlm<Qualification>(
      llm,
      prompt,
      'qualification',
      QUALIFICATION_SCHEMA
    );
    if (!ALLOWED_CATEGORIES.includes(qualification.category)) {
      qualification.category = 'culture';
    }
    return { qualification };
  } catch (err) {
    return { error: `Qualification impossible : ${(err as Error).message}` };
  }
}

async function rankNode(state: QualifierState): Promise<Partial<QualifierState>> {
  if (state.error || !state.qualification) return {};

  const allFolders = listFolders();
  const tags = listTags();

  // On ne propose que les dossiers de la catégorie déjà déterminée par la qualification,
  // pour éviter toute incohérence entre "category" et le dossier choisi.
  const candidateFolders = allFolders.filter((f) => f.category === state.qualification!.category);
  const folders = candidateFolders.length > 0 ? candidateFolders : allFolders;

  const prompt = fillTemplate(rankPromptTemplate, {
    folders: folders.map((f) => `- ${f.name} (${f.category})`).join('\n'),
    tags: tags.length ? tags.map((t) => t.name).join(', ') : '(aucun pour le moment)',
    title: state.qualification.title,
    summary: state.qualification.summary,
    category: state.qualification.category,
    whyInteresting: state.qualification.why_interesting,
  });

  const rankingSchema = {
    type: 'object',
    properties: {
      folder: { type: 'string', enum: folders.map((f) => f.name) },
      tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 },
    },
    required: ['folder', 'tags'],
    additionalProperties: false,
  };

  try {
    const ranking = await callStructuredLlm<Ranking>(llm, prompt, 'ranking', rankingSchema);
    const matchedFolder = folders.find((f) => f.name === ranking.folder);
    if (!matchedFolder) {
      ranking.folder = folders[0]?.name ?? ranking.folder;
    }
    if (!Array.isArray(ranking.tags) || ranking.tags.length === 0) {
      ranking.tags = [state.qualification.category];
    }
    return { ranking };
  } catch (err) {
    return { error: `Rangement impossible : ${(err as Error).message}` };
  }
}

async function persistNode(state: QualifierState): Promise<Partial<QualifierState>> {
  if (state.error) {
    updateSourceStatus(state.sourceId, 'error', state.error);
    return {};
  }
  if (!state.qualification || !state.ranking) {
    updateSourceStatus(state.sourceId, 'error', 'État incomplet avant persistance');
    return { error: 'État incomplet avant persistance' };
  }

  const folders = listFolders();
  const folder = folders.find((f) => f.name === state.ranking!.folder) ?? null;

  const article = createArticle({
    source_id: state.sourceId,
    title: state.qualification.title,
    summary: state.qualification.summary,
    nature: state.qualification.nature,
    legitimacy_note: state.qualification.legitimacy_note,
    why_interesting: state.qualification.why_interesting,
    augmentation_note: state.qualification.augmentation_note,
    category: state.qualification.category,
    folder_id: folder?.id ?? null,
    image_url: state.extractedImageUrl,
  });

  setArticleTags(article.id, state.ranking.tags, 'ai');
  updateSourceStatus(state.sourceId, 'processed');

  return { articleId: article.id };
}

function afterExtract(state: QualifierState) {
  return state.error ? 'persist' : 'qualify';
}

function afterQualify(state: QualifierState) {
  return state.error ? 'persist' : 'rank';
}

const builder = new StateGraph<QualifierState>({
  channels: {
    sourceId: { default: () => 0, reducer: overwrite<number> },
    extractedTitle: { default: () => null, reducer: overwrite<string | null> },
    extractedText: { default: () => '', reducer: overwrite<string> },
    extractedImageUrl: { default: () => null, reducer: overwrite<string | null> },
    qualification: { default: () => null, reducer: overwrite<Qualification | null> },
    ranking: { default: () => null, reducer: overwrite<Ranking | null> },
    articleId: { default: () => null, reducer: overwrite<number | null> },
    error: { default: () => null, reducer: overwrite<string | null> },
  },
});

builder.addNode('extract', extractNode as any);
builder.addNode('qualify', qualifyNode as any);
builder.addNode('rank', rankNode as any);
builder.addNode('persist', persistNode as any);

builder.addEdge(START as any, 'extract' as any);
builder.addConditionalEdges('extract' as any, afterExtract as any);
builder.addConditionalEdges('qualify' as any, afterQualify as any);
builder.addEdge('rank' as any, 'persist' as any);
builder.addEdge('persist' as any, END as any);

const graph = builder.compile();

export async function runQualifier(sourceId: number): Promise<{ articleId?: number; error?: string }> {
  const result = (await graph.invoke({ sourceId })) as QualifierState;
  if (result.error) return { error: result.error };
  return { articleId: result.articleId ?? undefined };
}
