import { ArrowLeft, CheckCircle2, Circle, MessageSquareHeart, Plus, Save, Sparkles, TrendingUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, type ArticleRow, type ReactionRow, type RepostRow } from '../api';
import {
  badge,
  badgeTones,
  Button,
  card,
  errorText,
  IconButton,
  Input,
  mutedText,
  pageTitle,
  sectionTitle,
  Select,
  Textarea,
} from '../ui';

const PLATFORMS = ['linkedin', 'x', 'blog'];

const SENTIMENT_LABEL: Record<ReactionRow['sentiment'], string> = {
  positive: 'Positif',
  negative: 'Négatif',
  neutral: 'Neutre',
};

const SENTIMENT_TONE: Record<ReactionRow['sentiment'], keyof typeof badgeTones> = {
  positive: 'emerald',
  negative: 'rose',
  neutral: 'slate',
};

export function ArticleDetailPage({ articleId, onBack }: { articleId: number; onBack: () => void }) {
  const [article, setArticle] = useState<(ArticleRow & { reposts: RepostRow[] }) | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [generating, setGenerating] = useState(false);
  const [repostError, setRepostError] = useState<string | null>(null);
  const [draft, setDraft] = useState<RepostRow | null>(null);
  const [reactionsList, setReactionsList] = useState<ReactionRow[]>([]);
  const [reactionInput, setReactionInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [reactionsError, setReactionsError] = useState<string | null>(null);
  const [optimizingSeo, setOptimizingSeo] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await api.getArticle(articleId);
      setArticle(data);
      setDraft(data.reposts[0] ?? null);
      setReactionsList(await api.listReactions(articleId));
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }

  useEffect(() => {
    refresh();
  }, [articleId]);

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTag.trim()) return;
    await api.addTags(articleId, [newTag.trim()]);
    setNewTag('');
    refresh();
  }

  async function handleRemoveTag(tagId: number) {
    await api.removeTag(articleId, tagId);
    refresh();
  }

  async function handleGenerate() {
    setGenerating(true);
    setRepostError(null);
    try {
      const repost = await api.repost(articleId, platform);
      setDraft(repost);
    } catch (err) {
      setRepostError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!draft) return;
    const updated = await api.updateRepost(draft.id, { content: draft.content });
    setDraft(updated);
  }

  async function handleTogglePublished() {
    if (!draft) return;
    const updated = await api.updateRepost(draft.id, { published: !draft.published });
    setDraft(updated);
  }

  async function handleOptimizeSeo() {
    if (!draft) return;
    setOptimizingSeo(true);
    setSeoError(null);
    try {
      const updated = await api.optimizeSeo(draft.id);
      setDraft(updated);
    } catch (err) {
      setSeoError((err as Error).message);
    } finally {
      setOptimizingSeo(false);
    }
  }

  async function handleAnalyzeReactions() {
    if (!reactionInput.trim()) return;
    setAnalyzing(true);
    setReactionsError(null);
    try {
      await api.analyzeReactions(articleId, reactionInput);
      setReactionInput('');
      await refresh();
    } catch (err) {
      setReactionsError((err as Error).message);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loadError) return <p className={errorText}>{loadError}</p>;
  if (!article) return <p className={mutedText}>Chargement...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" icon={ArrowLeft} className="-ml-3 mb-3" onClick={onBack}>
          Retour
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={pageTitle}>{article.title}</h2>
          {article.folder && <span className={badge}>{article.folder.name}</span>}
          <span className={badgeTones.slate}>{article.category}</span>
        </div>
      </div>

      {article.image_url && (
        <img
          src={article.image_url}
          alt=""
          className="h-48 w-full rounded-2xl object-cover shadow-sm shadow-pink-100"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      <div className={card}>
        <h3 className={sectionTitle}>Qualification</h3>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-500">Résumé</dt>
            <dd className="mt-0.5 text-slate-800">{article.summary}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Nature</dt>
            <dd className="mt-0.5 text-slate-800">{article.nature}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Légitimité</dt>
            <dd className="mt-0.5 text-slate-800">{article.legitimacy_note}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Pourquoi intéressant</dt>
            <dd className="mt-0.5 text-slate-800">{article.why_interesting}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-slate-500">En quoi ça augmente</dt>
            <dd className="mt-0.5 text-slate-800">{article.augmentation_note}</dd>
          </div>
        </dl>
      </div>

      <div className={card}>
        <h3 className={sectionTitle}>Tags</h3>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {article.tags.map((t) => (
            <span
              key={t.id}
              className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                t.source === 'manual' ? 'bg-violet-100 text-violet-800' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {t.name}
              <IconButton icon={X} label={`Retirer le tag ${t.name}`} onClick={() => handleRemoveTag(t.id)} />
            </span>
          ))}
        </div>
        <form onSubmit={handleAddTag} className="flex gap-2">
          <Input
            type="text"
            className="max-w-xs"
            placeholder="Ajouter un tag manuellement"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <Button type="submit" variant="secondary" icon={Plus}>
            Ajouter
          </Button>
        </form>
      </div>

      <div className={card}>
        <h3 className={sectionTitle}>Republier avec valeur ajoutée</h3>
        <div className="flex flex-wrap gap-2">
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Button variant="primary" icon={Sparkles} disabled={generating} onClick={handleGenerate}>
            {generating ? 'Génération...' : 'Générer le post'}
          </Button>
        </div>
        {repostError && <p className={`${errorText} mt-2`}>{repostError}</p>}

        {draft && (
          <div className="mt-4">
            <Textarea rows={8} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button variant="secondary" icon={Save} onClick={handleSaveDraft}>
                Enregistrer
              </Button>
              <Button
                variant="secondary"
                icon={draft.published ? Circle : CheckCircle2}
                onClick={handleTogglePublished}
              >
                {draft.published ? 'Marquer non publié' : 'Marquer publié'}
              </Button>
              <Button variant="secondary" icon={TrendingUp} disabled={optimizingSeo} onClick={handleOptimizeSeo}>
                {optimizingSeo ? 'Optimisation...' : 'Optimiser SEO'}
                <span className={badgeTones.pink}>bonus</span>
              </Button>
              {draft.published ? <span className={badgeTones.emerald}>Publié</span> : null}
            </div>
            {seoError && <p className={`${errorText} mt-2`}>{seoError}</p>}
            {draft.seo_title && (
              <div className="mt-3 rounded-xl bg-pink-50 p-3 text-sm">
                <p>
                  <strong className="font-semibold text-slate-800">Titre SEO</strong>{' '}
                  <span className="text-slate-700">{draft.seo_title}</span>
                </p>
                <p>
                  <strong className="font-semibold text-slate-800">Meta-description</strong>{' '}
                  <span className="text-slate-700">{draft.seo_description}</span>
                </p>
                <p>
                  <strong className="font-semibold text-slate-800">Mots-clés</strong>{' '}
                  <span className="text-slate-700">{draft.seo_keywords}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={card}>
        <h3 className={sectionTitle}>Pertinence (bonus)</h3>
        <p className="text-sm text-slate-800">
          <strong className="font-semibold">Score de pertinence</strong> : {Math.round(article.relevance_score * 100)}%
          {article.mood_summary && <span className="text-slate-600"> — {article.mood_summary}</span>}
        </p>

        {reactionsList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {reactionsList.map((r) => (
              <span key={r.id} className={badgeTones[SENTIMENT_TONE[r.sentiment]]} title={r.reason}>
                {SENTIMENT_LABEL[r.sentiment]} : {r.text}
              </span>
            ))}
          </div>
        )}

        <Textarea
          className="mt-3"
          rows={4}
          placeholder="Colle des réactions/commentaires, une par ligne..."
          value={reactionInput}
          onChange={(e) => setReactionInput(e.target.value)}
        />
        <div className="mt-2">
          <Button variant="secondary" icon={MessageSquareHeart} disabled={analyzing} onClick={handleAnalyzeReactions}>
            {analyzing ? 'Analyse...' : 'Analyser les réactions'}
          </Button>
        </div>
        {reactionsError && <p className={`${errorText} mt-2`}>{reactionsError}</p>}
      </div>
    </div>
  );
}
