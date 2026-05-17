"use client";

import { AddBudgetForm } from "./add-budget-form";
import { BudgetRow, type BudgetRowData } from "./budget-row";

type Props = {
  defaults: BudgetRowData[];
  customs: BudgetRowData[];
  /** Todas as categorias atualmente em uso (default + custom) — usado pelo
   *  form de criação pra bloquear nomes duplicados. */
  existingNames: string[];
};

export function BudgetList({ defaults, customs, existingNames }: Props) {
  return (
    <>
      <ul className="border-t border-rule">
        {defaults.map((row) => (
          <li key={row.category} className="border-b border-rule">
            <BudgetRow initial={row} />
          </li>
        ))}
      </ul>

      {customs.length > 0 && (
        <>
          <p className="mt-10 mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            Seus orçamentos
          </p>
          <ul className="border-t border-rule">
            {customs.map((row) => (
              <li key={row.category} className="border-b border-rule">
                <BudgetRow initial={row} custom />
              </li>
            ))}
          </ul>
        </>
      )}

      <AddBudgetForm existing={existingNames} />
    </>
  );
}
