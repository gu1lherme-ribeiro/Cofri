import Link from "next/link";
import { listApiKeyStatuses } from "@/lib/api-keys";
import { requireSessionUserId } from "@/lib/session";
import { ByokForm } from "./byok-form";

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  const userId = await requireSessionUserId();
  const current = await listApiKeyStatuses(userId);

  return (
    <main className="min-h-screen">
      <div className="cofri-shell-narrow">
        <header className="mb-10 md:mb-14 lg:mb-16">
          <div className="flex items-baseline justify-between mb-6 md:mb-8">
            <p className="font-display text-[clamp(1.125rem,2vw,1.5rem)] font-bold tracking-[0.35em] text-ink">
              COFRI
            </p>
            <Link
              href="/dashboard"
              prefetch
              className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)]"
            >
              ← Voltar
            </Link>
          </div>
          <div className="border-b border-rule pb-2">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">
              Conta · chaves de LLM
            </p>
          </div>
        </header>

        <section className="mb-12">
          <h2
            className="font-display font-medium tracking-[-0.01em] text-ink mb-3"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Sua chave de modelo
          </h2>
          <p className="text-ink-muted max-w-prose leading-relaxed">
            O Cofri interpreta suas mensagens com o LLM que você escolher. Cole
            sua chave aqui — uma vez salva, o bot passa a usar essa chave em vez
            do fallback do servidor.
          </p>
        </section>

        <ByokForm current={current} />
      </div>
    </main>
  );
}
