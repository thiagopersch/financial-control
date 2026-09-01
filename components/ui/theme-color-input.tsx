'use client';

import { Button } from '@/components/ui/button';
import { ColorInput } from '@/components/ui/color-input';
import {
  APP_PRIMARY_COLOR_HEX,
  APP_PRIMARY_COLOR_SENTINEL,
  isAppPrimaryColor,
} from '@/lib/notification-templates/theme-color';
import { cn } from '@/lib/utils';

interface ThemeColorInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  /** Hex the "Cor personalizada" input seeds with when switching away from "Cor padrão do app". Defaults to the app's primary color. */
  customSeedColor?: string;
}

export function ThemeColorInput({
  value,
  onChange,
  className,
  disabled,
  customSeedColor = APP_PRIMARY_COLOR_HEX,
}: ThemeColorInputProps) {
  const isDefault = isAppPrimaryColor(value);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="border-input flex w-fit items-center gap-1 rounded-lg border p-1">
        <Button
          type="button"
          size="sm"
          variant={isDefault ? 'default' : 'ghost'}
          className="h-7 text-xs"
          disabled={disabled}
          onClick={() => onChange(APP_PRIMARY_COLOR_SENTINEL)}
        >
          Cor padrão do app
        </Button>
        <Button
          type="button"
          size="sm"
          variant={!isDefault ? 'default' : 'ghost'}
          className="h-7 text-xs"
          disabled={disabled}
          onClick={() => {
            if (isDefault) onChange(customSeedColor);
          }}
        >
          Cor personalizada
        </Button>
      </div>
      {!isDefault && <ColorInput value={value} onChange={onChange} disabled={disabled} />}
    </div>
  );
}
