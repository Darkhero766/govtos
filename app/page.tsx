'use client';

import { useMemo, useState } from 'react';
import { aiChat, aiDraft, aiScamReason, aiTriage } from '../ai/openaiClient';
import { extractIncidentDraft } from '../ai/extractIncidentDraft';
import { publicCaseSignals, type CaseSignal } from '../data/publicCaseSignals';
import { scamCheck } from '../scam-check/scamCheck';
import { buildStatusTimeline, calculateTypicalRange } from '../status/statusMachine';
import { classifyWithRules, overrideTriage, type TriageResult } from '../triage/triageRules';
import { checkIncidentCharacters } from '../validation/characterGuard';
import { syntheticHistoricalCases } from '../data/syntheticCases';
import type { Journey } from '../types/models';
import './winner.css';
import './3d-ai.css';
import './mobile-final.css';

type Stage = 'home' | 'urgent' | 'standard' | 'safety' | 'intelligence' | 'status' | 'submitted';
type Evidence = { id: string; label: string; type: string };
type Complaint = { id: string; journey?: string; category: string; story: string; status: string; amount?: string; platform?: string };
type ChatMessage = { role: 'user' | 'assistant'; content: string };
const demoStory = 'A caller pretended to be from my bank and I transferred ₹18,500.';