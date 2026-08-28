import type { ChatOpenAI } from '@langchain/openai';

export async function callStructuredLlm<T>(
  llm: ChatOpenAI,
  prompt: string,
  schemaName: string,
  schema: Record<string, unknown>
): Promise<T> {
  const structuredLlm = llm.bind({
    response_format: {
      type: 'json_schema',
      json_schema: { name: schemaName, strict: true, schema },
    },
  } as any);
  const response = await structuredLlm.invoke(prompt);
  const raw = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
  return JSON.parse(raw) as T;
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
