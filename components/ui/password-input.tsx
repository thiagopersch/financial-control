'use client';

import { inputSx, splitInputProps } from '@/components/ui/input';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputBase from '@mui/material/InputBase';
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';

/** Campo de senha com botão de mostrar/ocultar (MUI `InputBase` + adornment). */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<'input'>, 'ref' | 'size' | 'color'>
>(function PasswordInput(
  { className, style, disabled, 'aria-invalid': ariaInvalid, ...props },
  ref,
) {
  const [visible, setVisible] = React.useState(false);
  const { base, native } = splitInputProps(props);
  return (
    <InputBase
      {...(base as object)}
      className={className}
      style={style}
      disabled={disabled}
      type={visible ? 'text' : 'password'}
      inputRef={ref}
      error={ariaInvalid === true || ariaInvalid === 'true'}
      inputProps={{ 'aria-invalid': ariaInvalid, ...native }}
      sx={{ ...inputSx, pr: 0.5 }}
      endAdornment={
        <InputAdornment position="end">
          <IconButton
            type="button"
            size="small"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setVisible((prev) => !prev)}
            edge="end"
            sx={{ mr: 0 }}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </IconButton>
        </InputAdornment>
      }
    />
  );
});
