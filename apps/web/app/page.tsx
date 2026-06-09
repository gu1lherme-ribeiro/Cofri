import Image from "next/image";
import Link from "next/link";
import { getSessionUserId } from "@/lib/session";
import { Reveal } from "./_components/reveal";
import { StatCountUp } from "./_components/count-up-on-view";
import { ScrollAwareHeader } from "./_components/scroll-aware-header";

const TELEGRAM_URL = "https://t.me/my_cofri_bot";
const TELEGRAM_HANDLE = "@my_cofri_bot";

export default async function Home() {
  const userId = await getSessionUserId();
  const isAuthed = Boolean(userId);

  return (
    <main className="bg-black text-ink overflow-x-clip">
      <TopBar isAuthed={isAuthed} />
      <Hero />
      <Dialogue />
      <Movements />
      <Inventory />
      <Cinematic />
      <Footer />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  TopBar                                                                    */
/* -------------------------------------------------------------------------- */

function TopBar({ isAuthed }: { isAuthed: boolean }) {
  return (
    <ScrollAwareHeader>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-[var(--layout-px)] py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-sm font-bold tracking-[0.35em] text-ink transition-colors hover:text-accent"
          aria-label="Cofri — início"
        >
          <Image
            src="/media/cofri-mascot.jpeg"
            alt=""
            width={28}
            height={28}
            className="rounded-[6px] grayscale"
            priority
          />
          COFRI
        </Link>

        <nav className="flex items-center gap-5 text-[13px] text-ink-muted">
          <Link
            href="#dialogo"
            className="relative hidden transition-colors after:pointer-events-none after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-[var(--ease-out-quint)] hover:text-ink hover:after:scale-x-100 sm:inline"
          >
            Diálogo
          </Link>
          <Link
            href="#fluxo"
            className="relative hidden transition-colors after:pointer-events-none after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 after:ease-[var(--ease-out-quint)] hover:text-ink hover:after:scale-x-100 sm:inline"
          >
            Fluxo
          </Link>
          {isAuthed ? (
            <Link
              href="/dashboard"
              className="group font-mono text-ink transition-colors hover:text-accent"
            >
              estúdio{" "}
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          ) : (
            <Link
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="group font-mono text-ink transition-colors hover:text-accent"
            >
              entrar{" "}
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          )}
        </nav>
      </div>
    </ScrollAwareHeader>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                      */
/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative border-b border-rule bg-black">
      <HairlineGrid />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-[var(--layout-px)] py-16 lg:grid-cols-12 lg:gap-8 lg:py-28">
        <div className="lg:col-span-7">
          <p
            className="animate-fade-in font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint"
            style={{ animationDelay: "0ms" }}
          >
            Estúdio financeiro por mensagem
          </p>

          <h1
            className="animate-fade-in mt-8 font-display font-bold leading-[0.95] tracking-[-0.04em] text-ink"
            style={{
              fontSize: "clamp(2.75rem, 9vw, 6.5rem)",
              animationDelay: "80ms",
            }}
          >
            Anote seus
            <br />
            <span className="text-ink">gastos</span>
            <br />
            <span className="italic font-medium">conversando.</span>
          </h1>

          <p
            className="animate-fade-in mt-10 max-w-xl text-[clamp(1rem,1.4vw,1.125rem)] leading-relaxed text-ink-muted"
            style={{ animationDelay: "160ms" }}
          >
            Envie uma mensagem natural pelo Telegram —{" "}
            <span className="text-ink">“gastei 45 no almoço”</span>,{" "}
            <span className="text-ink">“recebi 2k de freela ontem”</span>. O
            Cofri interpreta o texto, classifica a operação e devolve um painel
            web com tudo editável. Sem planilha, sem fricção, sem cadastro
            manual.
          </p>

          <div
            className="animate-fade-in mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4"
            style={{ animationDelay: "240ms" }}
          >
            <PrimaryCta href={TELEGRAM_URL}>
              Abrir no Telegram
              <ArrowGlyph />
            </PrimaryCta>
            <span
              className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-ink-faint"
              aria-disabled="true"
            >
              <span className="animate-breathe h-1.5 w-1.5 rounded-full bg-led" />
              WhatsApp em breve
            </span>
          </div>

          <dl
            className="animate-fade-in mt-12 grid grid-cols-2 gap-6 border-t border-rule pt-6 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-faint sm:max-w-xs"
            style={{ animationDelay: "320ms" }}
          >
            <div>
              <dt>acerto</dt>
              <dd className="mt-1 font-display text-lg font-medium tracking-tight text-ink">
                <StatCountUp kind="percent" value={94} duration={1100} />
              </dd>
            </div>
            <div>
              <dt>latência</dt>
              <dd className="mt-1 font-display text-lg font-medium tracking-tight text-ink">
                <StatCountUp kind="seconds" value={2} duration={1100} />
              </dd>
            </div>
          </dl>
        </div>

        {/* mascote / vídeo */}
        <div className="relative lg:col-span-5">
          <div
            className="animate-fade-in group relative mx-auto aspect-square max-w-[28rem] overflow-hidden rounded-[2px] lg:max-w-none"
            style={{ animationDelay: "120ms" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background:
                  "radial-gradient(120% 90% at 50% 50%, transparent 55%, #000 100%)",
              }}
            />
            <video
              className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.03]"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/media/cofri-mascot.jpeg"
              aria-hidden
            >
              <source src="/media/cofri-loop.mp4" type="video/mp4" />
            </video>
          </div>

          <p
            className="animate-fade-in mt-4 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint lg:text-left"
            style={{ animationDelay: "360ms" }}
          >
            o cofri · mascote oficial
          </p>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dialogue (chat mockup)                                                    */
/* -------------------------------------------------------------------------- */

type Exchange = {
  user: string;
  botKind: "expense" | "income" | "reminder" | "query";
  amount?: string;
  meta: string;
  body?: string;
};

const EXCHANGES: Exchange[] = [
  {
    user: "gastei 45 no almoço",
    botKind: "expense",
    amount: "−R$ 45,00",
    meta: "alimentação · hoje",
  },
  {
    user: "recebi 2k de freela ontem",
    botKind: "income",
    amount: "+R$ 2.000,00",
    meta: "trabalho · 24 mai",
  },
  {
    user: "lembrar de ligar pro Carlos sexta 14h",
    botKind: "reminder",
    body: "Carlos",
    meta: "sex · 14:00",
  },
  {
    user: "quanto gastei em mercado esse mês?",
    botKind: "query",
    amount: "R$ 428,90",
    meta: "em mercado · maio",
  },
];

function Dialogue() {
  return (
    <section
      id="dialogo"
      className="relative isolate overflow-hidden border-b border-rule bg-black"
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src="/media/cofri-dialogue.jpeg"
          alt=""
          fill
          sizes="100vw"
          quality={95}
          className="object-cover object-center"
          priority={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #000 0%, transparent 35%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-[var(--layout-px)] py-20 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-5">
            <SectionLabel index="01" text="Diálogo real" />
            <h2
              className="mt-6 font-display font-medium leading-[1.05] tracking-[-0.03em] text-ink"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
            >
              Basta escrever
              <br />
              como você fala.
            </h2>
            <p className="mt-8 text-ink-muted lg:max-w-sm">
              Sem comandos, sem listas de categorias, sem campos obrigatórios.
              O processador de linguagem natural interpreta português coloquial
              — gírias, datas relativas, valores por extenso — e devolve a
              confirmação imediatamente.
            </p>
          </Reveal>

          <div className="lg:col-span-7">
            <ChatMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatMockup() {
  return (
    <div className="rounded-[4px] border border-rule bg-surface/30 p-5 backdrop-blur-md transition-colors duration-500 ease-[var(--ease-out-quint)] hover:border-ink-faint sm:p-8">
      <div className="mb-6 flex items-center justify-between border-b border-rule pb-4">
        <div className="flex items-center gap-3">
          <Image
            src="/media/cofri-mascot.jpeg"
            alt=""
            width={36}
            height={36}
            className="rounded-[6px]"
          />
          <div>
            <p className="font-display text-sm font-medium tracking-tight text-ink">
              Cofri
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint">
              {TELEGRAM_HANDLE}
            </p>
          </div>
        </div>
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint sm:inline">
          online
        </span>
      </div>

      <Reveal as="ol" stagger amount={0.1} className="space-y-7">
        {EXCHANGES.map((ex, i) => (
          <li key={i} className="space-y-2">
            {/* user message */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-[6px] rounded-tr-[2px] bg-surface-2 px-4 py-2.5 text-[0.95rem] leading-snug text-ink shadow-[inset_0_0_0_1px_var(--color-rule)]">
                {ex.user}
              </div>
            </div>

            {/* bot response */}
            <div className="flex">
              <BotLine ex={ex} />
            </div>
          </li>
        ))}
      </Reveal>
    </div>
  );
}

function BotLine({ ex }: { ex: Exchange }) {
  const isMoney = ex.botKind === "expense" || ex.botKind === "income";
  const glyph =
    ex.botKind === "reminder" ? "→" : ex.botKind === "query" ? "↳" : "✓";

  const glyphColor =
    ex.botKind === "income"
      ? "text-positive"
      : ex.botKind === "expense"
      ? "text-positive" // ✓ é "registrado" — sage. Sinal vem antes do valor.
      : "text-accent";

  const amountColor =
    ex.botKind === "income"
      ? "text-positive"
      : ex.botKind === "expense"
      ? "text-negative"
      : "text-ink";

  return (
    <div className="flex max-w-[85%] items-baseline gap-2 font-mono text-[0.875rem] tabular-nums">
      <span className={`${glyphColor} text-base leading-none`}>{glyph}</span>
      <span className="text-ink-muted">
        {isMoney && ex.amount && (
          <span className={`${amountColor} font-semibold`}>{ex.amount}</span>
        )}
        {ex.botKind === "query" && ex.amount && (
          <span className={`${amountColor} font-semibold`}>{ex.amount}</span>
        )}
        {ex.body && <span className="text-ink">{ex.body}</span>}
        <span className="mx-2 text-ink-faint">·</span>
        <span>{ex.meta}</span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Movements (como funciona)                                                 */
/* -------------------------------------------------------------------------- */

function Movements() {
  const steps = [
    {
      n: "01",
      title: "Você envia.",
      body: "Escreva uma frase comum no chat do Telegram. Pode ser um gasto, uma receita, um lembrete ou uma pergunta. O bot processa o texto e devolve a confirmação em segundos.",
    },
    {
      n: "02",
      title: "A IA estrutura.",
      body: "Um modelo de linguagem extrai o valor, a categoria, a data e a descrição da mensagem. Em casos ambíguos, o bot solicita uma reformulação — sem inferir informação que não foi fornecida.",
    },
    {
      n: "03",
      title: "Você refina.",
      body: "O comando /dashboard envia um link de acesso ao painel web. Tabela editável, filtros, gráficos e lembretes — tudo o que foi registrado pode ser ajustado posteriormente.",
    },
  ];

  return (
    <section id="fluxo" className="relative border-b border-rule">
      <HairlineGrid />
      <div className="mx-auto max-w-6xl px-[var(--layout-px)] py-20 lg:py-28">
        <Reveal>
          <SectionLabel index="02" text="Fluxo" />
          <h2
            className="mt-6 max-w-3xl font-display font-medium leading-[1.05] tracking-[-0.03em] text-ink"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            Três movimentos.
            <br />
            <span className="text-ink-muted">Nada além disso.</span>
          </h2>
        </Reveal>

        <Reveal
          as="ol"
          stagger
          className="mt-16 grid grid-cols-1 border-l border-t border-rule lg:grid-cols-3"
        >
          {steps.map((step) => (
            <li
              key={step.n}
              className="border-b border-r border-rule bg-surface/40 px-6 py-10 backdrop-blur-md lg:px-8 lg:py-12"
            >
              <p
                className="font-mono text-[clamp(2.5rem,4vw,3.5rem)] leading-none tracking-tight text-led"
                aria-hidden
              >
                {step.n}
              </p>
              <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-3 max-w-sm leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inventory (features)                                                      */
/* -------------------------------------------------------------------------- */

function Inventory() {
  const items: Array<{ k: string; v: string }> = [
    {
      k: "Edição inline",
      v: "Cada célula da tabela é editável diretamente. Categoria incorreta? Clique e altere — sem janelas modais, sem recarregamento de página.",
    },
    {
      k: "Login sem senha",
      v: "O comando /dashboard envia um link de acesso pelo próprio chat. Sem cadastro, sem recuperação de senha, sem credenciais para serem expostas.",
    },
    {
      k: "BYOK (Bring Your Own Key)",
      v: "Você fornece sua chave de API da OpenAI ou Anthropic, armazenada com criptografia AES-256-GCM. O custo de uso é seu, diretamente com o provedor — e tipicamente baixo.",
    },
    {
      k: "Lembretes",
      v: "Mesma sintaxe natural. “lembrar de ligar para o Carlos sexta às 14h” transforma-se em evento agendado no painel.",
    },
    {
      k: "Contas fixas",
      v: "Aluguel, assinaturas, parcelamentos. Cadastre uma vez e a despesa é projetada no orçamento mensal até a data de quitação.",
    },
    {
      k: "Insights",
      v: "Gráfico de rosca por categoria e série diária dos últimos 30 dias. Visualizações com identidade própria, sem temas genéricos.",
    },
  ];

  return (
    <section className="relative border-b border-rule bg-black">
      <HairlineGrid />
      <div className="mx-auto max-w-6xl px-[var(--layout-px)] py-20 lg:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-4">
            <SectionLabel index="03" text="Dentro do estúdio" />
            <h2
              className="mt-6 font-display font-medium leading-[1.05] tracking-[-0.03em] text-ink"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
            >
              O suficiente, <br />
              <span className="italic font-normal text-ink-muted">
                não mais.
              </span>
            </h2>
            <p className="mt-6 max-w-xs text-ink-muted">
              O escopo é deliberadamente pequeno. Cada recurso resolve um
              problema específico, com profundidade e cuidado.
            </p>
          </Reveal>

          <Reveal
            as="dl"
            stagger
            className="grid grid-cols-1 divide-y divide-rule rounded-[2px] border border-rule bg-surface/20 backdrop-blur-md sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:col-span-8"
          >
            {items.map((it, i) => (
              <div
                key={it.k}
                className={`group px-1 py-6 transition-colors duration-300 ease-[var(--ease-out-quint)] hover:bg-surface-2/30 sm:px-6 ${
                  i >= 2 ? "sm:border-t sm:border-rule" : ""
                }`}
                style={{ borderTopColor: "var(--color-rule)" }}
              >
                <dt className="font-display text-base font-medium tracking-tight text-ink transition-[color,transform] duration-300 ease-[var(--ease-out-quint)] group-hover:translate-x-1 group-hover:text-accent">
                  {it.k}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {it.v}
                </dd>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cinematic CTA                                                             */
/* -------------------------------------------------------------------------- */

function Cinematic() {
  return (
    <section className="relative isolate overflow-hidden border-b border-rule bg-black">
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src="/media/cofri-studio.jpeg"
          alt=""
          fill
          sizes="100vw"
          quality={95}
          className="object-cover object-center"
          priority={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background: [
              "linear-gradient(to right, #000 0%, #000 38%, transparent 72%)",
              "linear-gradient(to top, color-mix(in oklch, #000 35%, transparent) 0%, transparent 45%)",
            ].join(", "),
          }}
        />
      </div>

      <Reveal className="mx-auto max-w-6xl px-[var(--layout-px)] py-24 lg:py-36">
        <SectionLabel index="04" text="Começa em um minuto" />
        <h2
          className="mt-6 max-w-2xl font-display font-bold leading-[0.95] tracking-[-0.04em] text-ink"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5.25rem)" }}
        >
          Abra o Telegram.
          <br />
          <span className="italic font-medium text-ink-muted">
            Registre o primeiro gasto.
          </span>
        </h2>

        <p className="mt-8 max-w-md text-ink-muted">
          Envie qualquer mensagem para{" "}
          <span className="font-mono text-ink">{TELEGRAM_HANDLE}</span> e o bot
          orienta o restante. O uso é gratuito — apenas a chave do modelo de
          IA gera custo (ou utilize o crédito gratuito do provedor).
        </p>

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <PrimaryCta href={TELEGRAM_URL} size="lg">
            Conversar com o Cofri
            <ArrowGlyph />
          </PrimaryCta>
          <Link
            href="#dialogo"
            className="font-mono text-[12px] uppercase tracking-[0.18em] text-ink-muted underline decoration-rule decoration-from-font underline-offset-4 transition-colors hover:text-ink"
          >
            Ver outros exemplos
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="bg-black">
      <Reveal stagger className="mx-auto flex max-w-6xl flex-col gap-6 px-[var(--layout-px)] py-10 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p>
          © 2026 Cofri ·{" "}
          <span className="text-ink-muted">projeto pessoal</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span>Next.js</span>
          <span>·</span>
          <span>Fastify</span>
          <span>·</span>
          <span>grammY</span>
          <span>·</span>
          <span>Postgres</span>
        </p>
        <p>
          <Link
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="text-ink transition-colors hover:text-accent"
          >
            {TELEGRAM_HANDLE}
          </Link>
        </p>
      </Reveal>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Atoms                                                                     */
/* -------------------------------------------------------------------------- */

function SectionLabel({ index, text }: { index: string; text: string }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-faint">
      <span className="text-led">{index}</span>
      <span aria-hidden className="reveal-rule h-px w-8 bg-rule" />
      <span>{text}</span>
    </p>
  );
}

function PrimaryCta({
  href,
  children,
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const sizing =
    size === "lg"
      ? "px-7 py-4 text-[0.95rem]"
      : "px-5 py-3 text-[0.875rem]";

  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`group inline-flex items-center gap-3 rounded-[2px] bg-accent font-display font-medium tracking-tight text-canvas shadow-[0_0_0_0_transparent] transition-[transform,background-color,box-shadow] duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-[1px] hover:bg-[#ededed] hover:shadow-[0_12px_32px_-12px_#ffffff66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:translate-y-0 active:scale-[0.985] ${sizing}`}
    >
      {children}
    </Link>
  );
}

function ArrowGlyph() {
  return (
    <span
      aria-hidden
      className="inline-block translate-x-0 font-mono text-base leading-none transition-transform duration-200 ease-[var(--ease-out-quint)] group-hover:translate-x-1"
    >
      →
    </span>
  );
}

function HairlineGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 opacity-[0.4]"
      style={{
        backgroundImage:
          "linear-gradient(to right, var(--color-rule) 1px, transparent 1px), linear-gradient(to bottom, var(--color-rule) 1px, transparent 1px)",
        backgroundSize: "clamp(80px, 8vw, 140px) clamp(80px, 8vw, 140px)",
        maskImage:
          "radial-gradient(circle at 50% 35%, black 0%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(circle at 50% 35%, black 0%, transparent 75%)",
      }}
    />
  );
}
