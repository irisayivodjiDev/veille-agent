import { useEffect, useState } from 'react';
import { api, type SourceRow } from '../api';
import { badge, btnPrimary, btnSecondary, card, errorText, inputBase, mutedText, sectionTitle } from '../ui';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  processed: 'Qualifiée',
  rejected: 'Rejetée',
  error: 'Erreur',
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processed: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-slate-100 text-slate-600',
  error: 'bg-rose-100 text-rose-700',
};

export function SourcesPage({ onQualified }: { onQualified: (articleId: number) => void }) {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col gap-6">
      <div className={card}>
        <h2 className="mb-1 text-xl font-semibold text-slate-800">Capter</h2>
        <p className={mutedText + ' mb-4'}>Colle un lien ou une idée en texte libre pour la capturer.</p>
        <form className="flex gap-2" onSubmit={handleCapture}>
          <input
            type="text"
            className={inputBase}
            placeholder="https://... ou une idée en texte libre"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className={btnPrimary}>
            Capturer
          </button>
        </form>
        {actionError && <p className={errorText + ' mt-2'}>{actionError}</p>}
      </div>

      <div className={card}>
        <h3 className={sectionTitle}>Sources entrantes</h3>
        {loading && <p className={mutedText}>Chargement...</p>}
        {loadError && <p className={errorText}>{loadError}</p>}
        {!loading && !loadError && sources.length === 0 && (
          <p className={mutedText}>Aucune source pour l'instant.</p>
        )}

        {sources.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-pink-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Canal</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Contenu</th>
                  <th className="py-2 pr-3">Statut</th>
                  <th className="py-2 pr-3">Capturée le</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} className="border-b border-pink-50 last:border-0">
                    <td className="py-2 pr-3 text-slate-500">{s.id}</td>
                    <td className="py-2 pr-3 text-slate-700">{s.channel}</td>
                    <td className="py-2 pr-3 text-slate-700">{s.raw_type}</td>
                    <td className="max-w-xs truncate py-2 pr-3 text-slate-700">
                      {s.raw_url || s.transcript || s.raw_text}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`${badge} ${STATUS_STYLE[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABEL[s.status] || s.status}
                      </span>
                      {s.status === 'error' && s.error_message && (
                        <span className={mutedText + ' ml-2'}>{s.error_message}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-slate-500">
                      {new Date(s.captured_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2 pr-3">
                      {s.status === 'pending' && (
                        <button
                          className={btnSecondary}
                          disabled={processingId === s.id}
                          onClick={() => handleProcess(s.id)}
                        >
                          {processingId === s.id ? 'Qualification...' : 'Qualifier'}
                        </button>
                      )}
                      {s.status === 'error' && (
                        <button
                          className={btnSecondary}
                          disabled={processingId === s.id}
                          onClick={() => handleProcess(s.id)}
                        >
                          Réessayer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
