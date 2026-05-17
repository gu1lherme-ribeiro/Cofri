import { getSessionUserId } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const userId = await getSessionUserId();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <p className="font-display text-[24px] sm:text-[28px] font-bold tracking-[0.35em] text-ink mb-10 sm:mb-16">
          COFRI
        </p>

        <h1 className="font-display text-[2rem] sm:text-[2.5rem] leading-[1.05] font-medium tracking-[-0.02em] text-ink mb-8">
          Seu caderno-razão
          <br />
          de finanças pessoais.
        </h1>

        <p className="text-ink-muted max-w-md leading-relaxed">
          Você manda mensagens no Telegram, eu organizo. Pra acessar este
          estúdio, abra a conversa com{" "}
          <span className="text-ink">@my_cofri_bot</span> e mande o comando{" "}
          <span className="font-mono text-accent">/dashboard</span>.
        </p>

        <p className="mt-3 text-xs text-ink-faint uppercase tracking-[0.18em]">
          O link expira em dez minutos.
        </p>
      </div>
    </main>
  );
}
