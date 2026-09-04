import { useEffect, useState } from 'react';
import { api, type ArticleRow, type FolderRow } from '../api';
import { badge, card, errorText, inputBase, mutedText, sectionTitle } from '../ui';

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

  const folderBtn = (active: boolean) =>
    `block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
      active ? 'bg-pink-500 text-white shadow-sm shadow-pink-200' : 'text-slate-600 hover:bg-pink-50 hover:text-pink-700'
    }`;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className={card + ' h-fit w-full shrink-0 md:w-56'}>
        <h3 className={sectionTitle}>Dossiers</h3>
        <div className="flex flex-col gap-1">
          <button className={folderBtn(folderId === null)} onClick={() => setFolderId(null)}>
            Tous
          </button>
          {categories.map((cat) => (
            <div key={cat} className="mt-2">
              <div className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{cat}</div>
              <div className="mt-1 flex flex-col gap-1">
                {folders
                  .filter((f) => f.category === cat)
                  .map((f) => (
                    <button key={f.id} className={folderBtn(folderId === f.id)} onClick={() => setFolderId(f.id)}>
                      {f.name}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <h3 className={sectionTitle + ' mt-5'}>Filtrer par tag</h3>
        <input
          type="text"
          className={inputBase}
          placeholder="ex: ia"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
      </aside>

      <div className="min-w-0 flex-1">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Ranger</h2>
        {loading && <p className={mutedText}>Chargement...</p>}
        {loadError && <p className={errorText}>Erreur lors du chargement des articles : {loadError}</p>}
        {!loading && !loadError && articles.length === 0 && (
          <p className={mutedText}>Aucun article. Capture et qualifie une source pour en voir apparaître ici.</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {articles.map((a) => (
            <div
              key={a.id}
              className={card + ' cursor-pointer transition-shadow hover:shadow-md hover:shadow-pink-100'}
              onClick={() => onSelect(a.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <strong className="text-slate-800">{a.title}</strong>
                {a.folder && <span className={badge}>{a.folder.name}</span>}
              </div>
              <p className={mutedText + ' mt-1 line-clamp-3'}>{a.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.tags.map((t) => (
                  <span key={t.id} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
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
