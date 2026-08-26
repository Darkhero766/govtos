export function LargeActionButton({ children, onClick, tone = 'neutral' }: { children: React.ReactNode; onClick?: () => void; tone?: 'neutral' | 'danger' | 'calm' }) {
  const tones = {
    neutral: 'triage-card status',
    danger: 'triage-card urgent',
    calm: 'triage-card standard',
  };
  const labels = { neutral: 'TRACK A COMPLAINT', danger: 'ACT NOW', calm: 'REPORT AN INCIDENT' };
  const details = {
    neutral: 'Check an existing complaint, acknowledgment or follow-up.',
    danger: 'Financial fraud, unauthorized transfers and money moving now.',
    calm: 'Scams, cyberbullying, online harassment, threats and impersonation.',
  };
  const icons = { neutral: '↗', danger: '!', calm: '＋' };
  return (
    <button onClick={onClick} className={tones[tone]}>
      <span className="card-icon" aria-hidden="true">{icons[tone]}</span>
      <span className="card-copy">
        <span className="card-kicker">{labels[tone]}</span>
        <span className="card-title">{children}</span>
        <span className="card-detail">{details[tone]}</span>
      </span>
      <span className="card-arrow" aria-hidden="true">→</span>
    </button>
  );
}
