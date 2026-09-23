// lib/ai/knowledge/communication.ts

import { coverLetterKnowledge } from '../communication/coverletter';
import { followupKnowledge } from '../communication/followup';
import { objectionsKnowledge } from '../communication/objections';

export const CommunicationBase = {
  coverLetter: coverLetterKnowledge,
  followUp: followupKnowledge,
  objections: objectionsKnowledge,
};