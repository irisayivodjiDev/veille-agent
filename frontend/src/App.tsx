import { useState } from 'react';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { SourcesPage } from './pages/SourcesPage';

type View = 'sources' | 'articles';

const navBase = 'rounded-full px-4 py-1.5 text-sm font-medium transition-colors';
const navActive = 'bg-pink-500 text-white shadow-sm shadow-pink-200';
const navInactive = 'text-slate-500 hover:bg-pink-50 hover:text-pink-600';

export default function App() {
  const [view, setView] = useState<View>('sources');
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-white">
      <header className="border-b border-pink-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-800">
            🌸 App de veille
          </h1>
          <nav className="flex gap-2 rounded-full bg-pink-50 p-1">
            <button
              className={`${navBase} ${view === 'sources' ? navActive : navInactive}`}
              onClick={() => {
                setView('sources');
                setSelectedArticleId(null);
              }}
            >
              Capter
            </button>
            <button
              className={`${navBase} ${view === 'articles' ? navActive : navInactive}`}
              onClick={() => {
                setView('articles');
                setSelectedArticleId(null);
              }}
            >
              Qualifier / Ranger / Republier
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {view === 'sources' && (
          <SourcesPage
            onQualified={(articleId) => {
              setView('articles');
              setSelectedArticleId(articleId);
            }}
          />
        )}
        {view === 'articles' &&
          (selectedArticleId ? (
            <ArticleDetailPage articleId={selectedArticleId} onBack={() => setSelectedArticleId(null)} />
          ) : (
            <ArticlesPage onSelect={setSelectedArticleId} />
          ))}
      </main>
    </div>
  );
}
