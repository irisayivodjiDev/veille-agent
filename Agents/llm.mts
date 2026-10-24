import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import 'dotenv/config';

// Utilise Gemini (API gratuite) si une clé est configurée, sinon retombe sur
// LM Studio en local. Un seul endroit à changer pour faire évoluer le
// fournisseur du modèle pour tous les agents.
export function getChatModel(temperature = 0.5, maxTokens = 1024): BaseChatModel {
  if (process.env.GOOGLE_API_KEY) {
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      temperature,
      maxOutputTokens: maxTokens,
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
