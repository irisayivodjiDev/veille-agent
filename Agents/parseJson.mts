import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { z } from 'zod';

// withStructuredOutput est fourni par LangChain pour chaque fournisseur
// (OpenAI/LM Studio, Gemini, Anthropic...) : plus fiable qu'un prompt JSON
// fait main, et surtout portable si on change de modèle plus tard.
export async function callStructuredLlm<T>(
  llm: BaseChatModel,
  prompt: string,
  schemaName: string,
  schema: z.ZodType<T>
): Promise<T> {
  const structuredLlm = llm.withStructuredOutput<T>(schema, { name: schemaName });
  return structuredLlm.invoke(prompt);
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
