import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import 'dotenv/config';

// L'endpoint compatible OpenAI de Gemini rejette (400) les champs qu'il ne
// connaît pas, or @langchain/openai envoie toujours frequency_penalty et
// presence_penalty. On les retire du corps avant l'envoi.
const GEMINI_UNSUPPORTED_FIELDS = ['frequency_penalty', 'presence_penalty'];

const geminiFetch: typeof fetch = (input, init) => {
  if (typeof init?.body === 'string') {
    const body = JSON.parse(init.body);
    for (const field of GEMINI_UNSUPPORTED_FIELDS) delete body[field];
    // Le corps change de taille : on laisse fetch recalculer content-length.
    const headers = new Headers(init.headers);
    headers.delete('content-length');
    init = { ...init, headers, body: JSON.stringify(body) };
  }
  return fetch(input, init);
};

// Utilise Gemini (API gratuite) si une clé est configurée, sinon retombe sur
// LM Studio en local. Un seul endroit à changer pour faire évoluer le
// fournisseur du modèle pour tous les agents.
export function getChatModel(temperature = 0.5, maxTokens = 1024): BaseChatModel {
  if (process.env.GOOGLE_API_KEY) {
    return new ChatOpenAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      temperature,
      maxTokens,
      configuration: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        fetch: geminiFetch,
      },
    }) as unknown as BaseChatModel;
  }

  return new ChatOpenAI({
    temperature,
    maxTokens,
    model: process.env.LMSTUDIO_MODEL || 'dolphin3.0-llama3.1-8b',
    configuration: {
      baseURL: process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1',
      apiKey: 'not-needed',
    },
  }) as unknown as BaseChatModel;
}
