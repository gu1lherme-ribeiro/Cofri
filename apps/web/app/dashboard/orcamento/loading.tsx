export default function OrcamentoLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <section className="mb-16">
        <div className="h-3 w-44 bg-rule rounded mb-3" />
        <div className="h-10 sm:h-12 w-56 sm:w-72 bg-rule rounded" />
        <div className="mt-5">
          <div className="h-1 bg-rule rounded-full max-w-md" />
          <div className="h-3 w-32 bg-rule rounded mt-2" />
        </div>
      </section>
      <div className="space-y-3">
        <div className="h-12 bg-rule rounded" />
        <div className="h-12 bg-rule rounded" />
        <div className="h-12 bg-rule rounded" />
        <div className="h-12 bg-rule rounded" />
      </div>
    </div>
  );
}
