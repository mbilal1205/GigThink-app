import { proposalHooks } from '../proposal/hooks';
import { proposalStructure } from '../proposal/structure';
import { proposalTone } from '../proposal/tone';
import { proposalCTA } from '../proposal/cta';
import { proposalClosing } from '../proposal/closing';

export const ProposalBase = {
  hooks: proposalHooks,
  structure: proposalStructure,
  tone: proposalTone,
  cta: proposalCTA,
  closing: proposalClosing
};