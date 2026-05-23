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
  availableCategories: string[];
};

export function TransactionRow({ tx, availableCategories }: Props) {
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
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 py-4 sm:grid sm:grid-cols-[5rem_minmax(0,1fr)_auto] sm:gap-x-6">
            <span className="font-mono text-xs tracking-wider text-negative uppercase">
              excluir?
            </span>
            <p className="text-ink-muted truncate min-w-0 flex-1 basis-full sm:basis-auto">
              {tx.description}
            </p>
            <div className="flex gap-4 text-xs font-mono uppercase tracking-[0.15em] py-1">
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
                className="text-negative hover:text-ink transition-colors duration-[var(--duration-base)] min-h-[44px] sm:min-h-0 flex items-center"
              >
                confirmar
              </button>
              <button
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="text-ink-faint hover:text-ink transition-colors duration-[var(--duration-base)] min-h-[44px] sm:min-h-0 flex items-center"
              >
                cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="group grid items-baseline grid-cols-[minmax(0,1fr)_auto_1.5rem] gap-x-3 gap-y-1 py-3 sm:grid-cols-[5rem_minmax(0,1fr)_auto_1.25rem] sm:gap-x-6 sm:gap-y-0 sm:py-4">
            {/* data: mobile → linha 2 (full row); desktop → linha 1 col 1 */}
            <div className="row-start-2 col-span-3 sm:row-start-1 sm:col-start-1 sm:col-span-1">
              <EditableDate
                value={tx.occurredAt}
                pending={pending}
                onSave={(occurredAt) => update({ occurredAt })}
              />
            </div>
            {/* descrição + categoria: mobile → linha 1 col 1; desktop → col 2 */}
            <div className="row-start-1 col-start-1 min-w-0 sm:col-start-2">
              <EditableDescription
                value={tx.description}
                pending={pending}
                onSave={(description) => update({ description })}
              />
              <div className="mt-0.5">
                <EditableCategory
                  value={tx.category}
                  pending={pending}
                  options={availableCategories}
                  onSave={(category) => update({ category })}
                />
              </div>
            </div>
            {/* valor: mobile → linha 1 col 2; desktop → col 3 */}
            <div className="row-start-1 col-start-2 sm:col-start-3">
              <EditableAmount
                value={tx.amount}
                kind={tx.kind}
                pending={pending}
                onSave={(amount) => update({ amount })}
              />
            </div>
            {/* deletar: sempre visível em touch; revela-no-hover só em ≥ md */}
            <button
              onClick={() => setConfirming(true)}
              disabled={pending}
              aria-label="Excluir registro"
              className="row-start-1 col-start-3 sm:col-start-4 text-ink-faint hover:text-negative md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 transition-[opacity,color] duration-[var(--duration-base)] text-sm leading-none flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
