import type { IncidentDraft, Journey } from '../types/models';

async function requestAI(body: unknown): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 10000);
  try {
    return await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

export async function aiTriage(story: string): Promise<{ journey: Journey; reason: string }> {
  const response = await requestAI({ operation: 'triage', story });
  if (!response.ok) throw new Error('AI triage unavailable');
  return response.json();
}

export async function aiChat(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<{ reply: string; journey: Journey }> {
  const response = await requestAI({ operation: 'chat', messages });
  if (!response.ok) throw new Error('AI chat unavailable');
  return response.json();
}

export async function aiDraft(input: { story: string; amount: string; approximateTime: string; platform: string }): Promise<IncidentDraft & { summary: string }> {
  const response = await requestAI({ operation: 'draft', ...input });
  if (!response.ok) throw new Error('AI drafting unavailable');
  return response.json();
}

export async function aiScamReason(input: { query: string; result: string; signal: string }): Promise<{ explanation: string }> {
  const response = await requestAI({ operation: 'scamReason', ...input });
  if (!response.ok) throw new Error('AI scam reasoning unavailable');
  return response.json();
}