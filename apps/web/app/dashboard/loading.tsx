export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <section className="mb-16">
        <div className="h-3 w-32 bg-rule rounded mb-4" />
        <div className="h-12 w-56 bg-rule rounded" />
      </section>
      <div className="space-y-3">
        <div className="h-10 bg-rule rounded" />
        <div className="h-10 bg-rule rounded" />
        <div className="h-10 bg-rule rounded" />
        <div className="h-10 bg-rule rounded" />
        <div className="h-10 bg-rule rounded" />
      </div>
    </div>
  );
}
