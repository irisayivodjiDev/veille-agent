import 'dotenv/config';

import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { loadAgentPrompt } from "./generate_prompt.mts";
import { weather } from "./tools/weather.mts";
import { add } from "./tools/add.mts";
import { getChatModel } from "../llm.mts";

const agentPrompt = loadAgentPrompt('Agent');

// Utilise la factory LM Studio partagée (Agents/llm.mts) au lieu d'un modèle
// codé en dur ici : le modèle vient de LMSTUDIO_MODEL dans .env, comme pour
// les autres agents de l'app de veille.
const agentModel = getChatModel(0.3);

const agentCheckpointer = new MemorySaver();
export const agent = createReactAgent({
  prompt: agentPrompt,
  llm: agentModel,
  tools: [weather, add],
  checkpointSaver: agentCheckpointer,
});
