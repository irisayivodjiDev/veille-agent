import { Moon, Radar, Send, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BackgroundDecor } from './BackgroundDecor';
import { ArticleDetailPage } from './pages/ArticleDetailPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { SourcesPage } from './pages/SourcesPage';
import { applyTheme, getInitialTheme, type Theme } from './theme';
import { IconButton } from './ui';

type View = 'sources' | 'articles';

const navBase =
  'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900';
const navActive = 'bg-pink-500 text-white shadow-sm shadow-pink-200 dark:shadow-none';
const navInactive = 'text-slate-600 hover:bg-pink-50 hover:text-pink-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-pink-300';

export default function App() {
  const [view, setView] = useState<View>('sources');
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="min-h-screen">
      <BackgroundDecor />

      <header className="border-b border-pink-100 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            <span aria-hidden>🌸</span> App de veille
          </h1>
          <div className="flex items-center gap-3">
            <nav className="flex gap-1 rounded-full bg-pink-100/70 p-1 dark:bg-slate-800">
              <button
                className={`${navBase} ${view === 'sources' ? navActive : navInactive}`}
                onClick={() => {
                  setView('sources');
                  setSelectedArticleId(null);
                }}
              >
                <Send size={14} aria-hidden /> Capter
              </button>
              <button
                className={`${navBase} ${view === 'articles' ? navActive : navInactive}`}
                onClick={() => {
                  setView('articles');
                  setSelectedArticleId(null);
                }}
              >
                <Radar size={14} aria-hidden /> Qualifier / Ranger / Republier
              </button>
            </nav>
            <IconButton
              icon={theme === 'dark' ? Sun : Moon}
              iconSize={18}
              label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className="h-9 w-9 border border-pink-200 bg-white text-pink-600 hover:bg-pink-50 dark:border-slate-600 dark:bg-slate-800 dark:text-pink-300 dark:hover:bg-slate-700"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
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
