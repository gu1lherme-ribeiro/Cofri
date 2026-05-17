export default function InsightsLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <section className="mb-16">
        <div className="flex items-baseline justify-between mb-6">
          <div className="h-3 w-56 bg-rule rounded" />
          <div className="h-3 w-24 bg-rule rounded" />
        </div>
        <div className="h-64 bg-rule rounded" />
      </section>
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <div className="h-3 w-64 bg-rule rounded" />
          <div className="h-3 w-24 bg-rule rounded" />
        </div>
        <div className="h-48 bg-rule rounded" />
      </section>
    </div>
  );
}
