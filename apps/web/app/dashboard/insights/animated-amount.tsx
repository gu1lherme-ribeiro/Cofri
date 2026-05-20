"use client";

import { formatAmount } from "@/lib/format";
import { useCountUp } from "@/lib/hooks/use-count-up";

type Props = {
  value: number;
};

export function AnimatedAmount({ value }: Props) {
  const animated = useCountUp(value);
  return <>{formatAmount(animated)}</>;
}
