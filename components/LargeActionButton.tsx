export function LargeActionButton({ children, onClick, tone = 'neutral' }: { children: React.ReactNode; onClick?: () => void; tone?: 'neutral' | 'danger' | 'calm' }) {
  const tones = {
    neutral: 'triage-card status',
    danger: 'triage-card urgent',
    calm: 'triage-card standard',
  };
  const labels = { neutral: 'STATUS CHECK', danger: 'URGENT', calm: 'STANDARD' };
  return (
    <button onClick={onClick} className={tones[tone]}>
      <span className="card-kicker">{labels[tone]}</span>
      <span className="card-title">{children}</span>
    </button>
  );
}
