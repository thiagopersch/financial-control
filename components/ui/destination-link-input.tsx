'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  APP_LINK_SLUG_PREFIX,
  getAppSlugValue,
  isAppSlugLink,
  makeAppSlugLink,
} from '@/lib/notification-templates/app-link';
import { cn } from '@/lib/utils';

interface DestinationLinkInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function DestinationLinkInput({
  value,
  onChange,
  className,
  disabled,
}: DestinationLinkInputProps) {
  const isSlugMode = isAppSlugLink(value);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="border-input flex w-fit items-center gap-1 rounded-lg border p-1">
        <Button
          type="button"
          size="sm"
          variant={!isSlugMode ? 'default' : 'ghost'}
          className="h-7 text-xs"
          disabled={disabled}
          onClick={() => {
            if (isSlugMode) onChange('');
          }}
        >
          URL completa
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isSlugMode ? 'default' : 'ghost'}
          className="h-7 text-xs"
          disabled={disabled}
          onClick={() => {
            if (!isSlugMode) onChange(APP_LINK_SLUG_PREFIX);
          }}
        >
          Link do app
        </Button>
      </div>

      {isSlugMode ? (
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground shrink-0 text-xs">{origin}/</span>
          <Input
            value={getAppSlugValue(value).replace(/^\//, '')}
            onChange={(e) => onChange(makeAppSlugLink(e.target.value))}
            disabled={disabled}
            placeholder="transactions"
          />
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="https://"
        />
      )}
    </div>
  );
}
