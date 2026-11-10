'use client';

import MuiSlider from '@mui/material/Slider';

/** Controle deslizante (MUI `Slider`). `value`/`onValueChange` usam array, como antes. */
export function Slider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  className,
}: {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}) {
  const toArray = (v: number | number[]) => (Array.isArray(v) ? v : [v]);
  const unwrap = (v?: number[]) => (v && v.length === 1 ? v[0] : v);
  return (
    <MuiSlider
      size="small"
      className={className}
      value={unwrap(value)}
      defaultValue={unwrap(defaultValue)}
      onChange={(_e, v) => onValueChange?.(toArray(v))}
      onChangeCommitted={(_e, v) => onValueCommit?.(toArray(v))}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    />
  );
}
