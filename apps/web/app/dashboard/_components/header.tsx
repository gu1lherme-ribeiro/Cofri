import Link from "next/link";
import { DashboardNav } from "./nav";
import { HeaderContextLabel } from "./header-context-label";

export function DashboardHeader() {
  return (
    <header className="mb-10 md:mb-14 lg:mb-16">
      <div className="flex items-baseline justify-between mb-6 md:mb-8">
        <p className="font-display text-[clamp(1.125rem,2vw,1.5rem)] font-bold tracking-[0.35em] text-ink">
          COFRI
        </p>
        <Link
          href="/conta"
          prefetch
          className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)]"
        >
          Conta
        </Link>
      </div>
      <div className="flex items-baseline justify-between border-b border-rule pb-2">
        <DashboardNav />
        <HeaderContextLabel />
      </div>
    </header>
  );
}
