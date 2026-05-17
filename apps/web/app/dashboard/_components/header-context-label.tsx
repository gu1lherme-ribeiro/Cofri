"use client";

import { useEffect, useState } from "react";
import { currentMonthLabel } from "@/lib/format";

export function HeaderContextLabel() {
  // Calculado no cliente após hidratação pra evitar mismatch caso o servidor
  // esteja em outro fuso. O fallback inicial usa o "agora" do render do server.
  const [label, setLabel] = useState(() => currentMonthLabel());

  useEffect(() => {
    setLabel(currentMonthLabel());
  }, []);

  return (
    <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-faint">
      {label}
    </p>
  );
}
