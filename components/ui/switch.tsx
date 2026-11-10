'use client';

import MuiSwitch from '@mui/material/Switch';
import * as React from 'react';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  size?: 'sm' | 'default';
}

/** Interruptor liga/desliga (MUI `Switch`). */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { onCheckedChange, size, className, id, 'aria-label': ariaLabel, ...props },
  ref,
) {
  return (
    <MuiSwitch
      ref={ref}
      size={size === 'sm' ? 'small' : 'medium'}
      className={className}
      onChange={(_e, checked) => onCheckedChange?.(checked)}
      slotProps={{ input: { id, 'aria-label': ariaLabel, role: 'switch' } }}
      {...props}
    />
  );
});
