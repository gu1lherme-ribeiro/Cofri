type Reason = "expired" | "missing";

const REASONS: Record<Reason, { line1: string; line2: string }> = {
  expired: { line1: "Esse link", line2: "já expirou." },
  missing: { line1: "Esse link", line2: "veio incompleto." },
};

function parseReason(value: string | undefined): Reason {
  return value === "missing" ? "missing" : "expired";
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cofri · Link expirado",
};

export default async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const r = parseReason(reason);
  const { line1, line2 } = REASONS[r];

  return (
    <main className="min-h-screen flex items-center">
      <div className="cofri-shell-narrow w-full">
        <p className="font-display text-[clamp(1.375rem,3.5vw,1.875rem)] font-bold tracking-[0.35em] text-ink mb-10 sm:mb-14 lg:mb-16">
          COFRI
        </p>

        <h1
          className="font-display leading-[1.05] font-medium tracking-[-0.02em] text-ink mb-8"
          style={{ fontSize: "var(--text-h1)" }}
        >
          {line1}
          <br />
          {line2}
        </h1>

        {r === "expired" ? (
          <p className="text-ink-muted max-w-md leading-relaxed">
            Por segurança, os links de acesso valem só dez minutos. Volte ao
            Telegram e mande{" "}
            <span className="font-mono text-accent">/dashboard</span> de novo —
            sai um novo na hora.
          </p>
        ) : (
          <p className="text-ink-muted max-w-md leading-relaxed">
            A URL chegou sem o token de autenticação. Volte ao Telegram, abra a
            conversa com <span className="text-ink">@my_cofri_bot</span> e mande{" "}
            <span className="font-mono text-accent">/dashboard</span>.
          </p>
        )}

        <p className="mt-10 sm:mt-12 text-xs uppercase tracking-[0.18em] flex items-center gap-3 text-ink-faint">
          <a
            href="https://t.me/my_cofri_bot"
            className="font-mono text-accent hover:text-ink transition-colors duration-[var(--duration-base)]"
          >
            Abrir Telegram
          </a>
          <span aria-hidden className="text-rule">
            /
          </span>
          <span>Cada link vale dez minutos</span>
        </p>
      </div>
    </main>
  );
}
