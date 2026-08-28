import { useEffect, useState } from 'react';
import { api, type SourceRow } from '../api';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  processed: 'Qualifiée',
  rejected: 'Rejetée',
  error: 'Erreur',
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
    <div className="page">
      <h2>Capter</h2>
      <form className="capture-form" onSubmit={handleCapture}>
        <input
          type="text"
          placeholder="Colle un lien ou une idée en texte libre..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Capturer</button>
      </form>
      {actionError && <p className="error">{actionError}</p>}

      <h3>Sources entrantes</h3>
      {loading && <p>Chargement...</p>}
      {loadError && <p className="error">{loadError}</p>}
      {!loading && !loadError && sources.length === 0 && <p className="muted">Aucune source pour l'instant.</p>}

      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Canal</th>
            <th>Type</th>
            <th>Contenu</th>
            <th>Statut</th>
            <th>Capturée le</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.channel}</td>
              <td>{s.raw_type}</td>
              <td className="truncate">{s.raw_url || s.transcript || s.raw_text}</td>
              <td>
                <span className={`badge badge-${s.status}`}>{STATUS_LABEL[s.status] || s.status}</span>
                {s.status === 'error' && s.error_message && (
                  <span className="muted"> — {s.error_message}</span>
                )}
              </td>
              <td>{new Date(s.captured_at).toLocaleString('fr-FR')}</td>
              <td>
                {s.status === 'pending' && (
                  <button disabled={processingId === s.id} onClick={() => handleProcess(s.id)}>
                    {processingId === s.id ? 'Qualification...' : 'Qualifier'}
                  </button>
                )}
                {s.status === 'error' && (
                  <button disabled={processingId === s.id} onClick={() => handleProcess(s.id)}>
                    Réessayer
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
