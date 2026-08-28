import { ChatOpenAI } from '@langchain/openai';
import 'dotenv/config';

export function getChatModel(temperature = 0.5, maxTokens = 1024): ChatOpenAI {
  return new ChatOpenAI({
    temperature,
    maxTokens,
    model: process.env.LMSTUDIO_MODEL || 'dolphin3.0-llama3.1-8b',
    configuration: {
      baseURL: process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1',
      apiKey: 'not-needed',
    },
  });
}
