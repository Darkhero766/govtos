create table if not exists public.complaints (
  id text primary key,
  created_at date not null default current_date,
  category text not null,
  journey text not null check (journey in ('urgent','standard','status')),
  status text not null default 'received' check (status in ('received','cyber_cell','outcome')),
  story text not null,
  amount text,
  platform text
);

alter table public.complaints enable row level security;

-- The app API uses the server-only service role key. Do not expose that key in NEXT_PUBLIC_* variables.
-- Optional seed data can be inserted through the Supabase SQL editor.
