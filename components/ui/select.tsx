'use client';

import Divider from '@mui/material/Divider';
import InputBase from '@mui/material/InputBase';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import MuiSelect from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';
import { inputSx } from '@/components/ui/input';

/**
 * Select do app sobre o MUI `Select`, mantendo a API composta de antes:
 *
 * <Select value onValueChange>
 *   <FormControl><SelectTrigger><SelectValue placeholder="…" /></SelectTrigger></FormControl>
 *   <SelectContent><SelectItem value="a">A</SelectItem></SelectContent>
 * </Select>
 *
 * O root acha o `SelectContent` entre os filhos e o `SelectTrigger` renderiza o
 * MUI Select com essas opções — assim o trigger continua recebendo `id`/`aria-*`
 * do `FormControl`.
 */
interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function findContent(children: React.ReactNode): React.ReactNode {
  let found: React.ReactNode = null;
  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement(child)) return;
    const props = child.props as { children?: React.ReactNode };
    if (child.type === SelectContent) found = props.children ?? null;
    else if (props.children) found = findContent(props.children);
  });
  return found;
}

export interface SelectProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
  required,
  open,
  onOpenChange,
  children,
}: SelectProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const isControlled = value !== undefined;
  const current = (isControlled ? value : internal) ?? '';
  const content = React.useMemo(() => findContent(children), [children]);

  const ctx: SelectContextValue = {
    value: current,
    onValueChange: (next) => {
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    },
    disabled,
    name,
    required,
    content,
    open,
    onOpenChange,
  };
  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
}

/** Converte os filhos do SelectContent em MenuItems (achatando grupos/fragmentos). */
function toMenuItems(
  children: React.ReactNode,
  labels: Map<string, React.ReactNode>,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as {
      value?: unknown;
      disabled?: boolean;
      className?: string;
      children?: React.ReactNode;
    };
    if (child.type === SelectItem) {
      const v = String(props.value ?? '');
      labels.set(v, props.children);
      out.push(
        <MenuItem
          key={`item-${v}`}
          value={v}
          disabled={props.disabled}
          className={props.className}
          sx={{ fontSize: '0.875rem', gap: 1, minHeight: 32 }}
        >
          {props.children}
        </MenuItem>,
      );
    } else if (child.type === SelectLabel) {
      out.push(
        <ListSubheader key={`label-${out.length}`} sx={{ lineHeight: '28px', fontSize: '0.75rem' }}>
          {props.children}
        </ListSubheader>,
      );
    } else if (child.type === SelectSeparator) {
      out.push(<Divider key={`sep-${out.length}`} />);
    } else if (props.children) {
      out.push(...toMenuItems(props.children, labels));
    }
  });
  return out;
}

function findPlaceholder(children: React.ReactNode): React.ReactNode {
  let placeholder: React.ReactNode = null;
  React.Children.forEach(children, (child) => {
    if (placeholder || !React.isValidElement(child)) return;
    if (child.type === SelectValue)
      placeholder = (child.props as { placeholder?: React.ReactNode }).placeholder ?? null;
  });
  return placeholder;
}

export const SelectTrigger = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<'button'>, 'ref'> & { size?: 'sm' | 'default' }
>(function SelectTrigger({ className, children, id, size, style, ...props }, ref) {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error('SelectTrigger must be used inside <Select>');
  const labels = new Map<string, React.ReactNode>();
  const items = toMenuItems(ctx.content, labels);
  const placeholder = findPlaceholder(children);
  const invalid = props['aria-invalid'] === true || props['aria-invalid'] === 'true';
  // Valor sem opção correspondente vira vazio (evita o aviso "out-of-range" do MUI).
  const value = labels.has(ctx.value) ? ctx.value : '';

  return (
    <MuiSelect
      ref={ref}
      data-slot="select-trigger"
      value={value}
      onChange={(event) => ctx.onValueChange(String(event.target.value))}
      displayEmpty
      disabled={ctx.disabled}
      name={ctx.name}
      required={ctx.required}
      error={invalid}
      open={ctx.open}
      onOpen={ctx.onOpenChange ? () => ctx.onOpenChange?.(true) : undefined}
      onClose={ctx.onOpenChange ? () => ctx.onOpenChange?.(false) : undefined}
      className={className}
      style={style}
      input={<InputShell />}
      IconComponent={(iconProps: { className?: string }) => (
        <ChevronDownIcon {...iconProps} style={{ width: 16, height: 16, right: 8, opacity: 0.6 }} />
      )}
      inputProps={{
        id,
        'aria-invalid': props['aria-invalid'],
        'aria-describedby': props['aria-describedby'],
        'aria-label': props['aria-label'],
      }}
      renderValue={(selected) =>
        selected === '' || selected == null ? (
          <Typography component="span" color="text.secondary" sx={{ fontSize: 'inherit' }}>
            {placeholder ?? 'Selecione'}
          </Typography>
        ) : (
          (labels.get(String(selected)) ?? String(selected))
        )
      }
      MenuProps={{
        slotProps: { paper: { sx: { maxHeight: 320 } }, list: { dense: true } },
      }}
      sx={{
        minWidth: 0,
        height: size === 'sm' ? 28 : 32,
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pr: '28px !important',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
      }}
    >
      {items}
    </MuiSelect>
  );
});

const InputShell = React.forwardRef<HTMLDivElement, Record<string, unknown>>(
  function InputShell(props, ref) {
    // InputBase com o visual dos demais campos (outlined do tema).
    return (
      <InputBase
        ref={ref}
        {...props}
        sx={{ ...inputSx, px: 0, '& .MuiSelect-select': { px: 1.25 } }}
      />
    );
  },
);

/** Marcadores: renderizados pelo `SelectTrigger`, não diretamente. */
export function SelectValue(_props: { placeholder?: React.ReactNode; className?: string }) {
  return null;
}
export function SelectContent(_props: {
  children?: React.ReactNode;
  className?: string;
  align?: string;
  side?: string;
  sideOffset?: number;
  alignItemWithTrigger?: boolean;
  position?: string;
}) {
  return null;
}
export function SelectItem(_props: {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return null;
}
export function SelectGroup({ children }: { children?: React.ReactNode; className?: string }) {
  return <>{children}</>;
}
export function SelectLabel(_props: { children?: React.ReactNode; className?: string }) {
  return null;
}
export function SelectSeparator(_props: { className?: string }) {
  return null;
}
export function SelectScrollUpButton() {
  return null;
}
export function SelectScrollDownButton() {
  return null;
}
