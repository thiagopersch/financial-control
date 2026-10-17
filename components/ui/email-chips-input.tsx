'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import * as z from 'zod';

const emailSchema = z.string().email();

interface EmailChipsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
}

/**
 * Free-form list of e-mails as chips: Enter, comma, semicolon, space or blur
 * commits the typed address; pasting a list adds all of them at once.
 */
export function EmailChipsInput({
  value,
  onChange,
  placeholder = 'nome@exemplo.com',
  id,
  disabled,
  'aria-invalid': ariaInvalid,
}: EmailChipsInputProps) {
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState<string | null>(null);

  const commit = (raw: string) => {
    const candidates = raw
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!candidates.length) return;

    const valid = candidates.filter((e) => emailSchema.safeParse(e).success);
    const bad = candidates.find((e) => !emailSchema.safeParse(e).success);
    const next = [...value, ...valid.filter((e) => !value.includes(e))];
    if (next.length !== value.length) onChange([...new Set(next)]);
    setInvalid(bad ?? null);
    setDraft(bad ?? '');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter never submits the surrounding form from here, even with an empty draft.
    if (e.key === 'Enter') e.preventDefault();
    if (['Enter', ',', ';', ' ', 'Tab'].includes(e.key) && draft.trim()) {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (/[\s,;]/.test(text)) {
      e.preventDefault();
      commit(`${draft} ${text}`);
    }
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'border-input dark:bg-input/30 flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 text-sm shadow-xs',
          'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
          (ariaInvalid || invalid) && 'border-destructive',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        {value.map((email) => (
          <Badge key={email} variant="secondary" className="gap-1 pr-1 font-normal">
            {email}
            <button
              type="button"
              onClick={() => onChange(value.filter((e) => e !== email))}
              className="hover:text-destructive cursor-pointer rounded-sm"
              aria-label={`Remover ${email}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          id={id}
          // type="text": type="email" strips separators/whitespace before onChange sees them.
          type="text"
          inputMode="email"
          autoComplete="off"
          value={draft}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value;
            setInvalid(null);
            // Covers mobile keyboards/IME and autofill, where the separator arrives without a keydown.
            if (/[\s,;]/.test(next)) commit(next);
            else setDraft(next);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => draft.trim() && commit(draft)}
          placeholder={value.length ? '' : placeholder}
          className="placeholder:text-muted-foreground min-w-40 flex-1 bg-transparent outline-none"
        />
      </div>
      {invalid && <p className="text-destructive text-xs">E-mail inválido: {invalid}</p>}
    </div>
  );
}
