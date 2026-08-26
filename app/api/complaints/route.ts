import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Complaint = { id: string; createdAt: string; category: string; journey: string; status: 'received' | 'cyber_cell' | 'outcome'; story: string; amount?: string; platform?: string };

const seed: Complaint[] = [
  { id: 'FR-260814-4821', createdAt: '2026-08-14', category: 'Financial fraud', journey: 'urgent', status: 'cyber_cell', story: 'UPI payment made after a fake bank call.', amount: '₹18,500', platform: 'UPI' },
  { id: 'FR-260816-1930', createdAt: '2026-08-16', category: 'Online harassment', journey: 'standard', status: 'received', story: 'Repeated threatening messages from a social account.', platform: 'Instagram' },
  { id: 'FR-260817-7712', createdAt: '2026-08-17', category: 'Impersonation', journey: 'standard', status: 'cyber_cell', story: 'A profile copied the citizen name and photographs.', platform: 'Instagram' },
  { id: 'FR-260820-4406', createdAt: '2026-08-20', category: 'Cyberbullying', journey: 'standard', status: 'received', story: 'Repeated abusive messages in a group chat.', platform: 'WhatsApp' },
  { id: 'FR-260821-9024', createdAt: '2026-08-21', category: 'Account takeover', journey: 'standard', status: 'outcome', story: 'Social account access was lost after a phishing link.', platform: 'Social media' },
  { id: 'FR-260823-3158', createdAt: '2026-08-23', category: 'Fake customer support', journey: 'urgent', status: 'cyber_cell', story: 'Fake support agent requested remote access and payment.', amount: '₹7,200', platform: 'Phone' },
];

let memory = [...seed];

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ''), key } : null;
}

async function supabaseFetch(path: string, init?: RequestInit) {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const response = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Database request failed: ${response.status}`);
  return response.status === 204 ? null : response.json();
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim().toLowerCase() || '';
  try {
    const rows = await supabaseFetch('complaints?select=id,created_at,category,journey,status,story,amount,platform&order=created_at.desc&limit=100');
    const source = (rows || memory).map((r: any) => ({ id: r.id, createdAt: r.created_at || r.createdAt, category: r.category, journey: r.journey, status: r.status, story: r.story, amount: r.amount, platform: r.platform }));
    const filtered = query ? source.filter((r: Complaint) => `${r.id} ${r.category} ${r.story} ${r.platform}`.toLowerCase().includes(query)) : source;
    return NextResponse.json({ connected: Boolean(supabaseConfig()), complaints: filtered });
  } catch {
    return NextResponse.json({ connected: false, complaints: memory, warning: 'Database unavailable; showing local demo records.' });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const complaint: Complaint = { id: body.id || `FR-${Date.now().toString().slice(-8)}`, createdAt: new Date().toISOString().slice(0, 10), category: body.category || 'Cybercrime report', journey: body.journey || 'standard', status: 'received', story: String(body.story || '').slice(0, 4000), amount: body.amount, platform: body.platform };
  try {
    const inserted = await supabaseFetch('complaints', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ id: complaint.id, created_at: complaint.createdAt, category: complaint.category, journey: complaint.journey, status: complaint.status, story: complaint.story, amount: complaint.amount, platform: complaint.platform }) });
    return NextResponse.json({ connected: true, complaint: inserted?.[0] || complaint });
  } catch {
    memory = [complaint, ...memory].slice(0, 100);
    return NextResponse.json({ connected: false, complaint, warning: 'Saved to this server session because the cloud database is not configured.' });
  }
}
