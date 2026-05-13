"use client";

import { useState } from "react";
import type { SerializedTransaction } from "@/lib/transactions";
import { EditableAmount } from "./editable-amount";
import { EditableCategory } from "./editable-category";
import { EditableDate } from "./editable-date";
import { EditableDescription } from "./editable-description";
import { useMutateTransaction } from "./use-mutate-transaction";

type Props = {
  tx: SerializedTransaction;
};

export function TransactionRow({ tx }: Props) {
  const { update, remove, pending } = useMutateTransaction(tx.id);
  const [confirming, setConfirming] = useState(false);
  const [collapsing, setCollapsing] = useState(false);

  return (
    <li
      className="collapsible"
      data-collapsed={collapsing || undefined}
      aria-hidden={collapsing || undefined}
    >
      <div>
        {confirming ? (
          <div className="grid grid-cols-[5rem_1fr_auto] gap-x-6 py-4 items-baseline">
            <span className="font-mono text-xs tracking-wider text-negative uppercase">
              excluir?
            </span>
            <p className="text-ink-muted truncate">{tx.description}</p>
            <div className="flex gap-4 text-xs font-mono uppercase tracking-[0.15em]">
              <button
                onClick={async () => {
                  setCollapsing(true);
                  try {
                    await remove();
                  } catch {
                    setCollapsing(false);
                    setConfirming(false);
                  }
                }}
                disabled={pending}
                className="text-negative hover:text-ink transition-colors duration-[var(--duration-base)]"
              >
                confirmar
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)]"
              >
                cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="group grid grid-cols-[5rem_1fr_auto_1.25rem] gap-x-6 py-4 items-baseline">
            <EditableDate
              value={tx.occurredAt}
              pending={pending}
              onSave={(occurredAt) => update({ occurredAt })}
            />
            <div className="min-w-0">
              <EditableDescription
                value={tx.description}
                pending={pending}
                onSave={(description) => update({ description })}
              />
              <div className="mt-0.5">
                <EditableCategory
                  value={tx.category}
                  pending={pending}
                  onSave={(category) => update({ category })}
                />
              </div>
            </div>
            <EditableAmount
              value={tx.amount}
              kind={tx.kind}
              pending={pending}
              onSave={(amount) => update({ amount })}
            />
            <button
              onClick={() => setConfirming(true)}
              disabled={pending}
              aria-label="Excluir registro"
              className="text-ink-faint hover:text-negative opacity-0 group-hover:opacity-100 focus:opacity-100 transition-[opacity,color] duration-[var(--duration-base)] text-sm leading-none"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
