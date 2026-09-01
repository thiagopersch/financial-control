'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ColorInput({ value, onChange, className, disabled }: ColorInputProps) {
  const swatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#000000';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label className="border-input relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border">
        <span
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: swatch }}
        />
        <input
          type="color"
          value={swatch}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="#000000 ou transparent"
        className="flex-1"
      />
    </div>
  );
}
