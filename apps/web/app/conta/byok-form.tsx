"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  PROVIDERS,
  type ApiKeyStatus,
  type Provider,
} from "@/lib/api-keys-shared";

type Props = {
  current: ApiKeyStatus[];
};

const PROVIDER_LABEL: Record<Provider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
};

const PROVIDER_HINT: Record<Provider, string> = {
  openai: "Cole uma chave que comece com sk-… (project ou org).",
  anthropic: "Cole uma chave que comece com sk-ant-…",
};

export function ByokForm({ current }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [provider, setProvider] = useState<Provider>("openai");
  const [key, setKey] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    if (key.trim().length < 10) {
      setFeedback({ kind: "error", text: "A chave parece curta demais." });
      return;
    }
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, key: key.trim() }),
    });
    if (!res.ok) {
      let detail = "Não consegui salvar.";
      try {
        const j = (await res.json()) as { error?: string };
        if (j.error) detail = j.error;
      } catch {}
      setFeedback({ kind: "error", text: detail });
      return;
    }
    setKey("");
    setFeedback({
      kind: "ok",
      text: `Chave ${PROVIDER_LABEL[provider]} salva e criptografada.`,
    });
    startTransition(() => router.refresh());
  }

  async function remove(p: Provider) {
    setFeedback(null);
    const res = await fetch(`/api/api-keys/${p}`, { method: "DELETE" });
    if (!res.ok) {
      setFeedback({ kind: "error", text: "Não consegui remover." });
      return;
    }
    setFeedback({
      kind: "ok",
      text: `Chave ${PROVIDER_LABEL[p]} removida.`,
    });
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="space-y-3 mb-10">
        {current.length === 0 ? (
          <p className="text-ink-muted text-sm">
            Nenhuma chave configurada ainda.
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {current.map((row) => (
              <li
                key={row.provider}
                className="grid grid-cols-[8rem_1fr_auto] gap-x-6 py-3 items-baseline"
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">
                  {PROVIDER_LABEL[row.provider]}
                </span>
                <span className="font-mono text-sm text-ink truncate">
                  {row.preview}
                </span>
                <button
                  onClick={() => void remove(row.provider)}
                  disabled={pending}
                  className="font-mono text-xs uppercase tracking-[0.15em] text-ink-faint hover:text-negative transition-colors duration-[var(--duration-base)]"
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          {current.some((c) => c.provider === provider)
            ? "Substituir chave"
            : "Adicionar chave"}
        </p>

        <div className="grid grid-cols-[8rem_1fr] gap-x-6 items-center">
          <label
            htmlFor="provider"
            className="font-mono text-xs uppercase tracking-[0.15em] text-ink-faint"
          >
            Provider
          </label>
          <div className="flex gap-4">
            {PROVIDERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                disabled={pending}
                className={`text-sm transition-colors duration-[var(--duration-base)] ${
                  provider === p
                    ? "text-ink underline underline-offset-4 decoration-accent"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {PROVIDER_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[8rem_1fr] gap-x-6 items-baseline">
          <label
            htmlFor="key"
            className="font-mono text-xs uppercase tracking-[0.15em] text-ink-faint"
          >
            Chave
          </label>
          <div>
            <input
              id="key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={provider === "openai" ? "sk-…" : "sk-ant-…"}
              disabled={pending}
              className="w-full bg-transparent text-ink font-mono text-sm py-2 border-b border-rule focus:border-accent outline-none transition-colors duration-[var(--duration-base)]"
            />
            <p className="mt-1 text-xs text-ink-faint">
              {PROVIDER_HINT[provider]}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[8rem_1fr] gap-x-6 items-center pt-2">
          <span />
          <div className="flex items-center gap-6">
            <button
              type="submit"
              disabled={pending || key.length === 0}
              className="font-mono text-xs uppercase tracking-[0.18em] text-accent hover:text-ink disabled:text-ink-faint disabled:opacity-50 transition-colors duration-[var(--duration-base)]"
            >
              {pending ? "salvando…" : "salvar"}
            </button>
            {feedback && (
              <span
                className={`text-xs font-mono ${
                  feedback.kind === "ok" ? "text-positive" : "text-negative"
                }`}
              >
                {feedback.text}
              </span>
            )}
          </div>
        </div>
      </form>

      <div className="mt-12 pt-6 border-t border-rule text-xs text-ink-faint leading-relaxed max-w-prose">
        <p>
          As chaves são criptografadas com{" "}
          <span className="font-mono text-ink-muted">AES-256-GCM</span> no
          servidor, usando uma chave-mestre que vive apenas no ambiente do
          Cofri. Nunca ficam em texto claro no banco e nunca aparecem em
          respostas da API.
        </p>
      </div>
    </div>
  );
}
