import { Bot, Send, User } from 'lucide-react';
import { useState } from 'react';
import { api } from './api';
import { Button, card, errorText, Input, mutedText, sectionTitle } from './ui';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Petit chat de démo qui réutilise l'agent LangGraph du squelette du cours
// (agent météo, POST /Agent/invoke) — pas connecté aux données de veille,
// juste une vitrine de l'agent déjà fourni.
export function ChatWidget() {
  const [threadId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const response = await api.chat(trimmed, threadId);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.content }]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={card}>
      <h3 className={`${sectionTitle} flex items-center gap-1.5`}>
        <Bot size={14} aria-hidden /> Discuter avec l'agent (démo)
      </h3>

      <div className="mb-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && <p className={mutedText}>Pose-lui une question, par exemple sur la météo.</p>}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-pink-500 text-white'
                : 'bg-pink-50 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
            }`}
          >
            {m.role === 'assistant' && <Bot size={14} className="mt-0.5 shrink-0" aria-hidden />}
            <span>{m.content}</span>
            {m.role === 'user' && <User size={14} className="mt-0.5 shrink-0" aria-hidden />}
          </div>
        ))}
        {sending && <p className={mutedText}>L'agent réfléchit...</p>}
      </div>

      {error && <p className={`${errorText} mb-2`}>{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          type="text"
          placeholder="Écris un message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit" variant="primary" icon={Send} disabled={sending}>
          Envoyer
        </Button>
      </form>
    </div>
  );
}
