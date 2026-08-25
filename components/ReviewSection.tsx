export function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="mb-2 text-lg font-black text-slate-950">{title}</h3><div className="space-y-2 text-slate-700">{children}</div></section>;
}
