export function LargeActionButton({ children, onClick, tone = 'neutral' }: { children: React.ReactNode; onClick?: () => void; tone?: 'neutral' | 'danger' | 'calm' }) {
  const tones = { neutral: 'border-slate-300 bg-white text-slate-950', danger: 'border-red-700 bg-red-700 text-white', calm: 'border-blue-700 bg-blue-700 text-white' };
  return <button onClick={onClick} className={`min-h-16 w-full rounded-2xl border-2 p-4 text-left text-lg font-bold shadow-sm transition hover:scale-[1.01] ${tones[tone]}`}>{children}</button>;
}
