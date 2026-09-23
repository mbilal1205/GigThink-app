// Path: lib/ai/prompts/masterPrompt.ts

import { identity } from "./identity";
import { behavior } from "./behavior";
import { conversation } from "./conversation";
import { proposal } from "./proposal";
import { language } from "./language";
import { security } from "./security";
import { format } from "./format";

export const MASTER_PROMPT = `
${identity}

${behavior}

${conversation}

${proposal}

${language}

${security}

${format}
`;