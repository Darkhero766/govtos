-- First Response hackathon demo data only.
-- This record is synthetic and contains no real personal, payment, Aadhaar, PAN, OTP, or other sensitive data.
-- Run this once in the Supabase SQL editor if the complaints table exists.

insert into complaints (
  id,
  path,
  description,
  status,
  created_at
) values (
  'FR-DEMO-2026-001',
  'calm',
  'DEMO ONLY: A synthetic user received repeated abusive messages on a social platform and wants help understanding how to report cyberbullying.',
  'received',
  now()
)
on conflict (id) do nothing;
