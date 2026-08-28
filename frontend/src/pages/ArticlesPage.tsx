import { useEffect, useState } from 'react';
import { api, type ArticleRow, type FolderRow } from '../api';

export function ArticlesPage({ onSelect }: { onSelect: (id: number) => void }) {
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [folderId, setFolderId] = useState<number | null>(null);
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    api.listFolders().then(setFolders).catch((err) => setLoadError((err as Error).message));
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    api
      .listArticles({ folderId: folderId ?? undefined, tag: tag || undefined })
      .then(setArticles)
      .catch((err) => setLoadError((err as Error).message))
      .finally(() => setLoading(false));
  }, [folderId, tag]);

  const categories = Array.from(new Set(folders.map((f) => f.category)));

  return (
    <div className="page articles-layout">
      <aside className="sidebar">
        <h3>Dossiers</h3>
        <button className={folderId === null ? 'active' : ''} onClick={() => setFolderId(null)}>
          Tous
        </button>
        {categories.map((cat) => (
          <div key={cat} className="folder-group">
            <div className="folder-category">{cat}</div>
            {folders
              .filter((f) => f.category === cat)
              .map((f) => (
                <button
                  key={f.id}
                  className={folderId === f.id ? 'active' : ''}
                  onClick={() => setFolderId(f.id)}
                >
                  {f.name}
                </button>
              ))}
          </div>
        ))}

        <h3>Filtrer par tag</h3>
        <input
          type="text"
          placeholder="ex: ia"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
      </aside>

      <div className="content">
        <h2>Ranger</h2>
        {loading && <p>Chargement...</p>}
        {loadError && <p className="error">Erreur lors du chargement des articles : {loadError}</p>}
        {!loading && !loadError && articles.length === 0 && (
          <p className="muted">Aucun article. Capture et qualifie une source pour en voir apparaître ici.</p>
        )}

        <div className="article-grid">
          {articles.map((a) => (
            <div key={a.id} className="article-card" onClick={() => onSelect(a.id)}>
              <div className="article-card-header">
                <strong>{a.title}</strong>
                {a.folder && <span className="badge">{a.folder.name}</span>}
              </div>
              <p className="muted">{a.summary}</p>
              <div className="tag-list">
                {a.tags.map((t) => (
                  <span key={t.id} className="tag">
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
