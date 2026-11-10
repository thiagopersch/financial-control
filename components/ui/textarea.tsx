'use client';

import InputBase from '@mui/material/InputBase';
import * as React from 'react';
import { inputSx, splitInputProps } from '@/components/ui/input';

export type TextareaProps = Omit<React.ComponentProps<'textarea'>, 'ref' | 'color'>;

/** Área de texto multilinha (MUI `InputBase multiline`). */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, style, rows, 'aria-invalid': ariaInvalid, disabled, readOnly, ...props },
  ref,
) {
  const { base, native } = splitInputProps(props);
  return (
    <InputBase
      {...(base as object)}
      multiline
      minRows={rows ?? 3}
      className={className}
      style={style}
      disabled={disabled}
      readOnly={readOnly}
      error={ariaInvalid === true || ariaInvalid === 'true'}
      inputRef={ref}
      sx={{ ...inputSx, py: 1, alignItems: 'flex-start' }}
      inputProps={{ 'data-slot': 'textarea', 'aria-invalid': ariaInvalid, ...native }}
    />
  );
});
