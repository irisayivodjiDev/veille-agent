import { RotateCcw, Send, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, type SourceRow } from '../api';
import { ChatWidget } from '../ChatWidget';
import { badgeTones, Button, card, errorText, Input, mutedText, pageTitle, Pagination, sectionTitle } from '../ui';

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  processed: 'Qualifiée',
  rejected: 'Rejetée',
  error: 'Erreur',
};

const STATUS_TONE: Record<string, keyof typeof badgeTones> = {
  pending: 'amber',
  processed: 'emerald',
  rejected: 'slate',
  error: 'rose',
};

export function SourcesPage({ onQualified }: { onQualified: (articleId: number) => void }) {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function refresh() {
    setLoading(true);
    setLoadError(null);
    try {
      const rows = await api.listSources();
      setSources(rows);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setActionError(null);
    try {
      const isUrl = /^https?:\/\/\S+$/i.test(trimmed);
      if (isUrl) {
        await api.captureUrl(trimmed);
      } else {
        await api.captureText(trimmed);
      }
      setInput('');
      await refresh();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  async function handleProcess(id: number) {
    setProcessingId(id);
    setActionError(null);
    try {
      const result = await api.processSource(id);
      await refresh();
      onQualified(result.articleId);
    } catch (err) {
      setActionError((err as Error).message);
      await refresh();
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Supprimer cette source (et l\'article associé si elle a déjà été qualifiée) ?')) {
      return;
    }
    setDeletingId(id);
    setActionError(null);
    try {
      await api.deleteSource(id);
      await refresh();
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const pageCount = Math.max(1, Math.ceil(sources.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageSources = sources.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className={card}>
        <h2 className={pageTitle}>Capter</h2>
        <p className={`${mutedText} mb-4 mt-1`}>Colle un lien ou une idée en texte libre pour la capturer.</p>
        <form className="flex flex-wrap gap-2" onSubmit={handleCapture}>
          <Input
            type="text"
            className="min-w-[16rem] flex-1"
            placeholder="https://... ou une idée en texte libre"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" variant="primary" icon={Send}>
            Capturer
          </Button>
        </form>
        {actionError && <p className={`${errorText} mt-2`}>{actionError}</p>}
      </div>

      <div className={card}>
        <h3 className={sectionTitle}>Sources entrantes</h3>
        {loading && <p className={mutedText}>Chargement...</p>}
        {loadError && <p className={errorText}>{loadError}</p>}
        {!loading && !loadError && sources.length === 0 && (
          <p className={mutedText}>Aucune source pour l'instant.</p>
        )}

        {sources.length > 0 && (
          <div className="overflow-hidden overflow-x-auto rounded-xl border border-pink-100 dark:border-slate-700">
            <table className="w-full min-w-2xl border-collapse text-sm">
              <thead>
                <tr className="bg-pink-50 text-left text-sm font-bold uppercase tracking-wide text-pink-700 dark:bg-slate-900 dark:text-pink-300">
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">Canal</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Contenu</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Capturée le</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50 dark:divide-slate-700">
                {pageSources.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-pink-50/60 dark:hover:bg-slate-700/50">
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{s.id}</td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-200">{s.channel}</td>
                    <td className="px-3 py-3 text-slate-800 dark:text-slate-200">{s.raw_type}</td>
                    <td className="max-w-xs truncate px-3 py-3 text-slate-800 dark:text-slate-200">
                      {s.raw_url || s.transcript || s.raw_text}
                    </td>
                    <td className="px-3 py-3">
                      <span className={badgeTones[STATUS_TONE[s.status] ?? 'slate']}>
                        {STATUS_LABEL[s.status] || s.status}
                      </span>
                      {s.status === 'error' && s.error_message && (
                        <span className={`${mutedText} ml-2`}>{s.error_message}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                      {new Date(s.captured_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {s.status === 'pending' && (
                          <Button
                            variant="secondary"
                            icon={Sparkles}
                            disabled={processingId === s.id}
                            onClick={() => handleProcess(s.id)}
                          >
                            {processingId === s.id ? 'Qualification...' : 'Qualifier'}
                          </Button>
                        )}
                        {s.status === 'error' && (
                          <Button
                            variant="secondary"
                            icon={RotateCcw}
                            disabled={processingId === s.id}
                            onClick={() => handleProcess(s.id)}
                          >
                            Réessayer
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          icon={Trash2}
                          disabled={deletingId === s.id}
                          onClick={() => handleDelete(s.id)}
                        >
                          {deletingId === s.id ? 'Suppression...' : 'Supprimer'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
      </div>

      <ChatWidget />
    </div>
  );
}
