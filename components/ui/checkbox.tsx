'use client';

import MuiCheckbox from '@mui/material/Checkbox';
import * as React from 'react';

export interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
}

/** Caixa de seleção (MUI `Checkbox`), com suporte a `indeterminate`. */
export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { checked, onCheckedChange, id, className, 'aria-label': ariaLabel, ...props },
  ref,
) {
  return (
    <MuiCheckbox
      ref={ref}
      size="small"
      className={className}
      checked={checked === 'indeterminate' ? false : checked}
      indeterminate={checked === 'indeterminate'}
      onChange={(_e, value) => onCheckedChange?.(value)}
      slotProps={{ input: { id, 'aria-label': ariaLabel } }}
      sx={{ p: 0.5 }}
      {...props}
    />
  );
});
