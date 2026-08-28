import { useEffect, useState } from 'react';
import { api, type ArticleRow, type RepostRow } from '../api';

const PLATFORMS = ['linkedin', 'x', 'blog'];

export function ArticleDetailPage({ articleId, onBack }: { articleId: number; onBack: () => void }) {
  const [article, setArticle] = useState<(ArticleRow & { reposts: RepostRow[] }) | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [generating, setGenerating] = useState(false);
  const [repostError, setRepostError] = useState<string | null>(null);
  const [draft, setDraft] = useState<RepostRow | null>(null);

  async function refresh() {
    try {
      const data = await api.getArticle(articleId);
      setArticle(data);
      setDraft(data.reposts[0] ?? null);
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

  if (loadError) return <p className="error">{loadError}</p>;
  if (!article) return <p>Chargement...</p>;

  return (
    <div className="page">
      <button onClick={onBack}>&larr; Retour</button>
      <h2>{article.title}</h2>
      {article.folder && <span className="badge">{article.folder.name}</span>}
      <span className="badge">{article.category}</span>

      <section className="qualification">
        <p><strong>Résumé</strong> : {article.summary}</p>
        <p><strong>Nature</strong> : {article.nature}</p>
        <p><strong>Légitimité</strong> : {article.legitimacy_note}</p>
        <p><strong>Pourquoi intéressant</strong> : {article.why_interesting}</p>
        <p><strong>En quoi ça augmente</strong> : {article.augmentation_note}</p>
      </section>

      <section>
        <h3>Tags</h3>
        <div className="tag-list">
          {article.tags.map((t) => (
            <span key={t.id} className={`tag ${t.source === 'manual' ? 'tag-manual' : ''}`}>
              {t.name}
              <button className="tag-remove" onClick={() => handleRemoveTag(t.id)}>
                ×
              </button>
            </span>
          ))}
        </div>
        <form onSubmit={handleAddTag} className="capture-form">
          <input
            type="text"
            placeholder="Ajouter un tag manuellement"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <button type="submit">Ajouter</button>
        </form>
      </section>

      <section>
        <h3>Republier avec valeur ajoutée</h3>
        <div className="capture-form">
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button disabled={generating} onClick={handleGenerate}>
            {generating ? 'Génération...' : 'Générer le post'}
          </button>
        </div>
        {repostError && <p className="error">{repostError}</p>}

        {draft && (
          <div className="repost-draft">
            <textarea
              rows={8}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
            />
            <div className="capture-form">
              <button onClick={handleSaveDraft}>Enregistrer les modifications</button>
              <button onClick={handleTogglePublished}>
                {draft.published ? 'Marquer comme non publié' : 'Marquer comme publié'}
              </button>
              {draft.published ? <span className="badge">Publié</span> : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
