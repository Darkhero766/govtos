'use client';

import { useEffect, useState } from 'react';

type Complaint = {
  id: string;
  title: string;
  category: string;
  status: string;
  city: string;
  updated: string;
};

const SEED: Complaint[] = [
  { id: 'FR-2026-1842', title: 'UPI payment scam', category: 'Financial fraud', status: 'Under review', city: 'Delhi', updated: 'Today' },
  { id: 'FR-2026-1837', title: 'Instagram impersonation', category: 'Identity abuse', status: 'Evidence requested', city: 'Mumbai', updated: 'Today' },
  { id: 'FR-2026-1819', title: 'Repeated online harassment', category: 'Cyberbullying', status: 'Action taken', city: 'Bengaluru', updated: 'Yesterday' },
  { id: 'FR-2026-1794', title: 'Threats sent through WhatsApp', category: 'Online threat', status: 'Assigned', city: 'Hyderabad', updated: 'Yesterday' },
  { id: 'FR-2026-1761', title: 'Fake customer-care number', category: 'Scam', status: 'Resolved', city: 'Pune', updated: '2 days ago' },
  { id: 'FR-2026-1748', title: 'Account takeover attempt', category: 'Account access', status: 'Under review', city: 'Kolkata', updated: '3 days ago' },
];

const KEY = 'first-response-complaint-db-v1';

function read(): Complaint[] {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved) as Complaint[];
    window.localStorage.setItem(KEY, JSON.stringify(SEED));
  } catch {}
  return SEED;
}

function save(rows: Complaint[]) {
  try { window.localStorage.setItem(KEY, JSON.stringify(rows)); } catch {}
}

export function PrototypeBanner() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<Complaint[]>([]);

  useEffect(() => {
    setRows(read());

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button) return;
      const label = (button.textContent || '').toLowerCase();
      if (!label.includes('mock report')) return;

      const next: Complaint = {
        id: `FR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        title: 'New citizen complaint',
        category: 'Cyber incident',
        status: 'Submitted',
        city: 'Not provided',
        updated: 'Just now',
      };
      const updated = [next, ...read()];
      save(updated);
      setRows(updated);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const filtered = rows.filter((row) => `${row.id} ${row.title} ${row.category} ${row.city} ${row.status}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <button type="button" className="case-database-trigger" onClick={() => setOpen(true)} aria-label="Open complaint database">
        <span>◉</span><strong>Complaint database</strong><small>{rows.length} records</small>
      </button>
      {open && <div className="case-database-backdrop" onClick={() => setOpen(false)}>
        <aside className="case-database" onClick={(event) => event.stopPropagation()} aria-label="Complaint database">
          <div className="case-db-head"><div><p className="eyebrow">First Response</p><h2>Complaint database</h2><p>Search complaint references and service records.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reference, city, category…" aria-label="Search complaints" />
          <div className="case-db-list">{filtered.map((row) => <article key={row.id}><div><b>{row.id}</b><h3>{row.title}</h3><p>{row.category} · {row.city}</p></div><span>{row.status}<small>{row.updated}</small></span></article>)}</div>
        </aside>
      </div>}
    </>
  );
}
