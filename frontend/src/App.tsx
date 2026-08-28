import { useState } from 'react';
import './App.css';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { SourcesPage } from './pages/SourcesPage';

type View = 'sources' | 'articles';

export default function App() {
  const [view, setView] = useState<View>('sources');
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>App de veille</h1>
        <nav>
          <button
            className={view === 'sources' ? 'active' : ''}
            onClick={() => {
              setView('sources');
              setSelectedArticleId(null);
            }}
          >
            Capter
          </button>
          <button
            className={view === 'articles' ? 'active' : ''}
            onClick={() => {
              setView('articles');
              setSelectedArticleId(null);
            }}
          >
            Qualifier / Ranger / Republier
          </button>
        </nav>
      </header>

      <main>
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
