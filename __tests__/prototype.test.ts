import { describe, expect, it } from 'vitest';
import { extractIncidentDraft } from '../ai/extractIncidentDraft';
import { extractSignals } from '../evidence/evidenceSignals';
import { scamCheck } from '../scam-check/scamCheck';
import { buildStatusTimeline } from '../status/statusMachine';
import { classifyWithRules, overrideTriage } from '../triage/triageRules';
import { buildTimeline, editTimelineEvent } from '../timeline/timelineBuilder';
import { syntheticHistoricalCases } from '../data/syntheticCases';

describe('triage routing', () => {
  it('routes financial fraud to urgent', () => expect(classifyWithRules('Money was debited from my bank').journey).toBe('urgent'));
  it('handles ambiguous classification safely', () => expect(classifyWithRules('help').confidence).toBe('low'));
  it('supports user override', () => expect(overrideTriage('status').journey).toBe('status'));
});

describe('incident extraction and hallucination prevention', () => {
  it('extracts stated amount only', () => expect(extractIncidentDraft('I transferred 18,500 after a fake bank call').amount).toBe('₹18,500'));
  it('does not invent missing facts', () => expect(extractIncidentDraft('Someone messaged me').amount).toBe("We don't know this yet."));
});

describe('evidence timeline', () => {
  it('extracts deterministic signals from mock evidence', () => expect(extractSignals('Paid INR 500 to refund-help@upi from +919999999999').upi).toBe('refund-help@upi'));
  it('builds and edits timeline events', () => {
    const timeline = buildTimeline('a caller asked me to transfer money', []);
    const edited = editTimelineEvent(timeline, 'call', { time: '14:02' });
    expect(edited.find((event) => event.id === 'call')?.time).toBe('14:02');
  });
});

describe('status state machine', () => {
  it('calculates synthetic timelines', () => {
    const statuses = buildStatusTimeline(syntheticHistoricalCases);
    expect(statuses.map((status) => status.state)).toEqual(['received', 'reviewing', 'action', 'outcome']);
    expect(statuses[1].simulatedDay).toBeGreaterThan(0);
  });
});

describe('scam check', () => {
  it('matches known mock signature', () => expect(scamCheck('refund-help@upi').result).toBe('MATCH'));
  it('returns no-match with safety language', () => expect(scamCheck('unknown@upi').message).toContain('does not mean safe'));
  it('returns inconclusive for malformed inputs', () => expect(scamCheck('x').result).toBe('INCONCLUSIVE'));
});
