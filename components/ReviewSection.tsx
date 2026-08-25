export function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="content-card">
      <h3>{title}</h3>
      <div className="content-card-body space-y-2">{children}</div>
    </section>
  );
}
