"use client";

import { BudgetRow, type BudgetRowData } from "./budget-row";

type Props = {
  initial: BudgetRowData[];
};

export function BudgetList({ initial }: Props) {
  return (
    <ul className="border-t border-rule">
      {initial.map((row) => (
        <li key={row.category} className="border-b border-rule">
          <BudgetRow initial={row} />
        </li>
      ))}
    </ul>
  );
}
