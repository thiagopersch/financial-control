'use client';

import InputBase from '@mui/material/InputBase';
import * as React from 'react';

/**
 * Campo de texto (MUI `InputBase` com o visual outlined do tema). Mantém a API
 * de `<input>` — `{...field}` do react-hook-form, `type`, `placeholder`… — e
 * aceita `aria-invalid` para o estado de erro.
 */
export type InputProps = Omit<React.ComponentProps<'input'>, 'ref' | 'size' | 'color'>;

export const inputSx = {
  width: '100%',
  minHeight: 32,
  px: 1.25,
  fontSize: '0.875rem',
  borderRadius: 1,
  border: 1,
  borderColor: 'divider',
  bgcolor: 'transparent',
  transition: 'border-color .15s, box-shadow .15s',
  '&:hover': { borderColor: 'text.secondary' },
  '&.Mui-focused': {
    borderColor: 'primary.main',
    boxShadow: '0 0 0 3px rgba(var(--mui-palette-primary-mainChannel) / 0.2)',
  },
  '&.Mui-error': { borderColor: 'error.main' },
  '&.Mui-disabled': { opacity: 0.6, bgcolor: 'action.hover' },
  '& input::placeholder, & textarea::placeholder': { color: 'text.secondary', opacity: 1 },
  '& input[type=file]': { py: 0.5 },
} as const;

/** Props que o `InputBase` controla; o resto vai direto para o <input>. */
export function splitInputProps<T extends Record<string, unknown>>(props: T) {
  const {
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    name,
    id,
    placeholder,
    autoComplete,
    autoFocus,
    required,
    ...native
  } = props;
  return {
    base: {
      value,
      defaultValue,
      onChange,
      onBlur,
      onFocus,
      onKeyDown,
      onKeyUp,
      name,
      id,
      placeholder,
      autoComplete,
      autoFocus,
      required,
    },
    native,
  };
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type, style, 'aria-invalid': ariaInvalid, disabled, readOnly, ...props },
  ref,
) {
  const invalid = ariaInvalid === true || ariaInvalid === 'true';
  const { base, native } = splitInputProps(props);
  return (
    <InputBase
      {...(base as object)}
      className={className}
      style={style}
      type={type}
      disabled={disabled}
      readOnly={readOnly}
      error={invalid}
      inputRef={ref}
      sx={inputSx}
      inputProps={{ 'data-slot': 'input', 'aria-invalid': ariaInvalid, ...native }}
    />
  );
});
