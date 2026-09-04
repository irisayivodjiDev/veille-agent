import { useEffect, useState } from 'react';
import { api, type ArticleRow, type ReactionRow, type RepostRow } from '../api';
import { badge, btnGhost, btnPrimary, btnSecondary, card, errorText, inputBase, mutedText, selectBase, sectionTitle } from '../ui';

const PLATFORMS = ['linkedin', 'x', 'blog'];

const SENTIMENT_LABEL: Record<ReactionRow['sentiment'], string> = {
  positive: 'Positif',
  negative: 'Négatif',
  neutral: 'Neutre',
};

const SENTIMENT_STYLE: Record<ReactionRow['sentiment'], string> = {
  positive: 'bg-emerald-100 text-emerald-700',
  negative: 'bg-rose-100 text-rose-700',
  neutral: 'bg-slate-100 text-slate-600',
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
        <button className={btnGhost + ' -ml-3 mb-3'} onClick={onBack}>
          ← Retour
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold text-slate-800">{article.title}</h2>
          {article.folder && <span className={badge}>{article.folder.name}</span>}
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {article.category}
          </span>
        </div>
      </div>

      <div className={card}>
        <h3 className={sectionTitle}>Qualification</h3>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">Résumé</dt>
            <dd className="text-slate-700">{article.summary}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Nature</dt>
            <dd className="text-slate-700">{article.nature}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Légitimité</dt>
            <dd className="text-slate-700">{article.legitimacy_note}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Pourquoi intéressant</dt>
            <dd className="text-slate-700">{article.why_interesting}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-slate-500">En quoi ça augmente</dt>
            <dd className="text-slate-700">{article.augmentation_note}</dd>
          </div>
        </dl>
      </div>

      <div className={card}>
        <h3 className={sectionTitle}>Tags</h3>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {article.tags.map((t) => (
            <span
              key={t.id}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                t.source === 'manual' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.name}
              <button
                className="text-current/60 hover:text-current"
                onClick={() => handleRemoveTag(t.id)}
                aria-label={`Retirer le tag ${t.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddTag} className="flex gap-2">
          <input
            type="text"
            className={inputBase}
            placeholder="Ajouter un tag manuellement"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <button type="submit" className={btnSecondary}>
            Ajouter
          </button>
        </form>
      </div>

      <div className={card}>
        <h3 className={sectionTitle}>Republier avec valeur ajoutée</h3>
        <div className="flex flex-wrap gap-2">
          <select className={selectBase + ' w-auto'} value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button className={btnPrimary} disabled={generating} onClick={handleGenerate}>
            {generating ? 'Génération...' : 'Générer le post'}
          </button>
        </div>
        {repostError && <p className={errorText + ' mt-2'}>{repostError}</p>}

        {draft && (
          <div className="mt-4">
            <textarea
              className={inputBase}
              rows={8}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button className={btnSecondary} onClick={handleSaveDraft}>
                Enregistrer les modifications
              </button>
              <button className={btnSecondary} onClick={handleTogglePublished}>
                {draft.published ? 'Marquer comme non publié' : 'Marquer comme publié'}
              </button>
              <button className={btnSecondary} disabled={optimizingSeo} onClick={handleOptimizeSeo}>
                {optimizingSeo ? 'Optimisation...' : '✨ Optimiser SEO (bonus)'}
              </button>
              {draft.published ? <span className={badge}>Publié</span> : null}
            </div>
            {seoError && <p className={errorText + ' mt-2'}>{seoError}</p>}
            {draft.seo_title && (
              <div className="mt-3 rounded-xl bg-pink-50 p-3 text-sm">
                <p>
                  <strong className="text-slate-700">Titre SEO</strong>{' '}
                  <span className="text-slate-600">{draft.seo_title}</span>
                </p>
                <p>
                  <strong className="text-slate-700">Meta-description</strong>{' '}
                  <span className="text-slate-600">{draft.seo_description}</span>
                </p>
                <p>
                  <strong className="text-slate-700">Mots-clés</strong>{' '}
                  <span className="text-slate-600">{draft.seo_keywords}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={card}>
        <h3 className={sectionTitle}>Pertinence (bonus)</h3>
        <p className="text-sm text-slate-700">
          <strong>Score de pertinence</strong> : {Math.round(article.relevance_score * 100)}%
          {article.mood_summary && <span className="text-slate-500"> — {article.mood_summary}</span>}
        </p>

        {reactionsList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {reactionsList.map((r) => (
              <span
                key={r.id}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SENTIMENT_STYLE[r.sentiment]}`}
                title={r.reason}
              >
                {SENTIMENT_LABEL[r.sentiment]} : {r.text}
              </span>
            ))}
          </div>
        )}

        <textarea
          className={inputBase + ' mt-3'}
          rows={4}
          placeholder="Colle des réactions/commentaires, une par ligne..."
          value={reactionInput}
          onChange={(e) => setReactionInput(e.target.value)}
        />
        <div className="mt-2">
          <button className={btnSecondary} disabled={analyzing} onClick={handleAnalyzeReactions}>
            {analyzing ? 'Analyse...' : 'Analyser les réactions'}
          </button>
        </div>
        {reactionsError && <p className={errorText + ' mt-2'}>{reactionsError}</p>}
      </div>
    </div>
  );
}
