"use client";

const OPTIONS = [0, 1, 2, 3, 5, 7] as const;

type Props = {
  value: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
};

export function LeadDaysPicker({ value, onChange, disabled }: Props) {
  function toggle(day: number) {
    if (disabled) return;
    const next = value.includes(day)
      ? value.filter((d) => d !== day)
      : [...value, day].sort((a, b) => a - b);
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((day) => {
        const selected = value.includes(day);
        const label = day === 0 ? "no dia" : `${day}d antes`;
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            disabled={disabled}
            className={[
              "font-mono text-[11px] uppercase tracking-[0.15em] px-3 py-2 sm:py-1.5 rounded-full border transition-[color,background-color,border-color] duration-[var(--duration-base)]",
              selected
                ? "bg-accent/10 text-accent border-accent"
                : "bg-transparent text-ink-faint border-rule hover:text-ink hover:border-ink-faint",
              disabled ? "opacity-50 pointer-events-none" : "",
            ].join(" ")}
            aria-pressed={selected}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
