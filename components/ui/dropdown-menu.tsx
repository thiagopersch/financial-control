'use client';

import { Slot, useControllableOpen } from '@/components/ui/slot';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';
import * as React from 'react';

/**
 * Menu suspenso (MUI `Menu`/`MenuItem`) com a API composta de antes
 * (DropdownMenu/Trigger/Content/Item/Sub/RadioGroup…). Como no Radix, um
 * `onSelect` que chama `event.preventDefault()` mantém o menu aberto.
 */
interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
  /** Fecha o menu raiz (itens dentro de submenus também fecham tudo). */
  closeAll: () => void;
}

const MenuContext = React.createContext<MenuContextValue | null>(null);

function useMenu() {
  const ctx = React.useContext(MenuContext);
  if (!ctx) throw new Error('DropdownMenu components must be used inside <DropdownMenu>');
  return ctx;
}

export function DropdownMenu({
  open,
  defaultOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children?: React.ReactNode;
}) {
  const [isOpen, setOpen] = useControllableOpen(open, defaultOpen, onOpenChange);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const value = React.useMemo(
    () => ({ open: isOpen, setOpen, anchorEl, setAnchorEl, closeAll: () => setOpen(false) }),
    [isOpen, setOpen, anchorEl],
  );
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<'button'> & { asChild?: boolean }) {
  const { open, setOpen, setAnchorEl } = useMenu();
  const triggerProps = {
    ref: setAnchorEl,
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      setOpen(!open);
    },
    'aria-haspopup': 'menu' as const,
    'aria-expanded': open,
  };
  if (asChild) return <Slot {...triggerProps}>{children}</Slot>;
  return (
    <button type="button" {...props} {...triggerProps}>
      {children}
    </button>
  );
}

export function DropdownMenuPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

type Align = 'start' | 'center' | 'end';

export function DropdownMenuContent({
  className,
  children,
  align = 'center',
  side = 'bottom',
  sideOffset = 4,
  onClick,
}: React.ComponentProps<'div'> & {
  align?: Align;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}) {
  const { open, setOpen, anchorEl } = useMenu();
  const horizontal = align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
  const vertical = side === 'top' ? 'top' : 'bottom';
  return (
    <Menu
      open={open && !!anchorEl}
      anchorEl={anchorEl}
      onClose={() => setOpen(false)}
      onClick={onClick as React.MouseEventHandler<HTMLDivElement> | undefined}
      anchorOrigin={{ vertical, horizontal }}
      transformOrigin={{ vertical: vertical === 'top' ? 'bottom' : 'top', horizontal }}
      slotProps={{
        paper: {
          'data-slot': 'dropdown-menu-content',
          className,
          sx: {
            minWidth: 128,
            mt: side === 'bottom' ? `${sideOffset}px` : undefined,
          },
        } as never,
        list: { dense: true, sx: { py: 0.5 } },
      }}
    >
      {children}
    </Menu>
  );
}

type SelectEvent = Event & { preventDefault(): void };

function useSelectHandler(
  onSelect: ((event: SelectEvent) => void) | undefined,
  onClick: React.MouseEventHandler<HTMLElement> | undefined,
) {
  const { closeAll } = useMenu();
  return (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onClick?.(event);
    onSelect?.(event.nativeEvent as SelectEvent);
    if (!event.defaultPrevented && !event.nativeEvent.defaultPrevented) closeAll();
  };
}

const itemSx = (variant?: string, inset?: boolean) => ({
  gap: 1,
  fontSize: '0.875rem',
  borderRadius: 0.75,
  mx: 0.5,
  minHeight: 32,
  pl: inset ? 4 : undefined,
  ...(variant === 'destructive' ? { color: 'error.main', '& svg': { color: 'error.main' } } : {}),
  '& svg': { width: 16, height: 16, flexShrink: 0 },
});

export interface DropdownMenuItemProps extends Omit<
  React.ComponentProps<'div'>,
  'onSelect' | 'onClick' | 'ref'
> {
  asChild?: boolean;
  inset?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  onSelect?: (event: SelectEvent) => void;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export function DropdownMenuItem({
  asChild,
  inset,
  disabled,
  variant,
  onSelect,
  onClick,
  className,
  children,
}: DropdownMenuItemProps) {
  const handle = useSelectHandler(onSelect, onClick);
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    const { children: inner, ...childProps } = child.props;
    return (
      <MenuItem
        component={child.type as React.ElementType}
        {...childProps}
        disabled={disabled}
        className={className}
        onClick={handle}
        sx={itemSx(variant, inset)}
      >
        {inner as React.ReactNode}
      </MenuItem>
    );
  }
  return (
    <MenuItem
      disabled={disabled}
      className={className}
      onClick={handle}
      data-variant={variant}
      sx={itemSx(variant, inset)}
    >
      {children}
    </MenuItem>
  );
}

export function DropdownMenuCheckboxItem({
  checked,
  onCheckedChange,
  disabled,
  className,
  children,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const handle = useSelectHandler((event) => {
    event.preventDefault();
    onCheckedChange?.(!checked);
  }, undefined);
  return (
    <MenuItem
      disabled={disabled}
      className={className}
      onClick={handle}
      sx={itemSx()}
      role="menuitemcheckbox"
      aria-checked={checked}
    >
      <ListItemIcon sx={{ minWidth: '20px !important' }}>
        {checked ? <CheckIcon /> : null}
      </ListItemIcon>
      {children}
    </MenuItem>
  );
}

const RadioContext = React.createContext<{ value?: string; onValueChange?: (v: string) => void }>(
  {},
);

export function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}) {
  return <RadioContext.Provider value={{ value, onValueChange }}>{children}</RadioContext.Provider>;
}

export function DropdownMenuRadioItem({
  value,
  disabled,
  className,
  children,
}: {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const radio = React.useContext(RadioContext);
  const handle = useSelectHandler(() => radio.onValueChange?.(value), undefined);
  const selected = radio.value === value;
  return (
    <MenuItem
      disabled={disabled}
      className={className}
      onClick={handle}
      selected={selected}
      role="menuitemradio"
      aria-checked={selected}
      sx={itemSx()}
    >
      <ListItemIcon sx={{ minWidth: '20px !important' }}>
        {selected ? <CircleIcon style={{ width: 8, height: 8, fill: 'currentColor' }} /> : null}
      </ListItemIcon>
      {children}
    </MenuItem>
  );
}

export function DropdownMenuLabel({
  className,
  inset,
  children,
}: React.ComponentProps<'div'> & { inset?: boolean }) {
  return (
    <Typography
      component="div"
      variant="caption"
      color="text.secondary"
      className={className}
      sx={{ px: inset ? 4 : 1.5, py: 0.75, fontWeight: 500, display: 'block' }}
    >
      {children}
    </Typography>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Divider className={className} sx={{ my: '4px !important' }} />;
}

export function DropdownMenuShortcut({ className, children }: React.ComponentProps<'span'>) {
  return (
    <Box
      component="span"
      className={className}
      sx={{ ml: 'auto', fontSize: '0.75rem', color: 'text.secondary' }}
    >
      {children}
    </Box>
  );
}

// --- Submenus ----------------------------------------------------------------

const SubContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  setAnchorEl: (el: HTMLElement | null) => void;
} | null>(null);

export function DropdownMenuSub({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  return (
    <SubContext.Provider value={{ open, setOpen, anchorEl, setAnchorEl }}>
      {children}
    </SubContext.Provider>
  );
}

export function DropdownMenuSubTrigger({
  className,
  inset,
  children,
}: React.ComponentProps<'div'> & { inset?: boolean }) {
  const sub = React.useContext(SubContext);
  return (
    <MenuItem
      ref={(el) => sub?.setAnchorEl(el)}
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        sub?.setOpen(!sub.open);
      }}
      onMouseEnter={() => sub?.setOpen(true)}
      aria-haspopup="menu"
      aria-expanded={sub?.open}
      sx={itemSx(undefined, inset)}
    >
      {children}
      <ChevronRightIcon style={{ marginLeft: 'auto' }} />
    </MenuItem>
  );
}

export function DropdownMenuSubContent({ className, children }: React.ComponentProps<'div'>) {
  const sub = React.useContext(SubContext);
  if (!sub) return null;
  return (
    <Menu
      open={sub.open && !!sub.anchorEl}
      anchorEl={sub.anchorEl}
      onClose={() => sub.setOpen(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: { className, sx: { minWidth: 128 } } as never,
        list: { dense: true, sx: { py: 0.5 }, onMouseLeave: () => sub.setOpen(false) } as never,
      }}
    >
      {children}
    </Menu>
  );
}
