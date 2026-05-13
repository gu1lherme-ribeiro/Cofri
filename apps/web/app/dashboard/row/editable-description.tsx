"use client";

import { useState } from "react";

type Props = {
  value: string;
  pending?: boolean;
  onSave: (next: string) => Promise<void>;
};

export function EditableDescription({ value, pending, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const [error, setError] = useState(false);

  async function commit(raw: string) {
    const next = raw.trim();
    setEditing(false);
    if (next === "" || next === value) {
      setLocal(value);
      return;
    }
    setLocal(next);
    setError(false);
    try {
      await onSave(next);
    } catch {
      setLocal(value);
      setError(true);
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={local}
        disabled={pending}
        maxLength={500}
        onBlur={(e) => void commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setLocal(value);
            setEditing(false);
          }
        }}
        className="w-full bg-transparent text-ink outline-none border-b border-accent pb-px -mb-px"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`text-left text-ink truncate w-full hover:underline decoration-dotted decoration-ink-faint underline-offset-4 ${
        error ? "text-negative" : ""
      } ${pending ? "opacity-60" : ""}`}
      title="Clicar para editar"
    >
      {local}
    </button>
  );
}
