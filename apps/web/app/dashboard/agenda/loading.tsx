export default function AgendaLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <section className="mb-16">
        <div className="h-3 w-40 bg-rule rounded mb-3" />
        <div className="h-12 w-24 bg-rule rounded" />
        <div className="h-4 w-48 bg-rule rounded mt-4" />
      </section>
      <div className="h-8 w-64 bg-rule rounded mb-6" />
      <div className="space-y-3">
        <div className="h-12 bg-rule rounded" />
        <div className="h-12 bg-rule rounded" />
        <div className="h-12 bg-rule rounded" />
      </div>
    </div>
  );
}
