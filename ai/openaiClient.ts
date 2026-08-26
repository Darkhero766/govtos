import type { IncidentDraft, Journey } from '../types/models';

export async function aiTriage(story: string): Promise<{ journey: Journey; reason: string }> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'triage', story }),
  });
  if (!response.ok) throw new Error('AI triage unavailable');
  return response.json();
}

export async function aiChat(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<{ reply: string; journey: Journey }> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'chat', messages }),
  });
  if (!response.ok) throw new Error('AI chat unavailable');
  return response.json();
}

export async function aiDraft(input: { story: string; amount: string; approximateTime: string; platform: string }): Promise<IncidentDraft & { summary: string }> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'draft', ...input }),
  });
  if (!response.ok) throw new Error('AI drafting unavailable');
  return response.json();
}

export async function aiScamReason(input: { query: string; result: string; signal: string }): Promise<{ explanation: string }> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operation: 'scamReason', ...input }),
  });
  if (!response.ok) throw new Error('AI scam reasoning unavailable');
  return response.json();
}