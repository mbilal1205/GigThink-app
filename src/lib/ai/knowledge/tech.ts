// lib/ai/knowledge/tech.ts

import { frontendTech } from '../tech/frontend';
import { backendTech } from '../tech/backend';
import { databaseTech } from '../tech/database';
import { cloudTech } from '../tech/cloud';
import { mobileTech } from '../tech/mobile';
import { securityTech } from '../tech/security';

export const TechBase = {
  frontend: frontendTech,
  backend: backendTech,
  database: databaseTech,
  cloud: cloudTech,
  mobile: mobileTech,
  security: securityTech
};