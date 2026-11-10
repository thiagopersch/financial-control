'use client';

import { Slot } from '@/components/ui/slot';
import MuiTooltip from '@mui/material/Tooltip';
import * as React from 'react';

/**
 * Dica (MUI `Tooltip`) com a API composta de antes:
 * `<Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>…</TooltipContent></Tooltip>`.
 */
type Side = 'top' | 'bottom' | 'left' | 'right';

/** Compat: o MUI não precisa de provider para tooltips. */
export function TooltipProvider({
  children,
}: {
  children?: React.ReactNode;
  delayDuration?: number;
}) {
  return <>{children}</>;
}

export function TooltipTrigger(_props: React.ComponentProps<'button'> & { asChild?: boolean }) {
  return null;
}

export function TooltipContent(
  _props: React.ComponentProps<'div'> & {
    side?: Side;
    sideOffset?: number;
    align?: string;
    hidden?: boolean;
  },
) {
  return null;
}

export function Tooltip({
  children,
  open,
  onOpenChange,
  delayDuration,
}: {
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}) {
  let trigger: React.ReactElement<React.ComponentProps<'button'> & { asChild?: boolean }> | null =
    null;
  let content: React.ReactElement<
    React.ComponentProps<'div'> & { side?: Side; hidden?: boolean }
  > | null = null;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === TooltipTrigger) trigger = child as never;
    else if (child.type === TooltipContent) content = child as never;
  });
  if (!trigger) return null;

  const {
    asChild,
    children: triggerChildren,
    ...triggerProps
  } = (trigger as React.ReactElement<React.ComponentProps<'button'> & { asChild?: boolean }>).props;
  const contentProps = (
    content as React.ReactElement<
      React.ComponentProps<'div'> & { side?: Side; hidden?: boolean }
    > | null
  )?.props;

  const anchor = asChild ? (
    <Slot {...(triggerProps as Record<string, unknown>)}>{triggerChildren}</Slot>
  ) : (
    <button type="button" {...triggerProps}>
      {triggerChildren}
    </button>
  );

  if (!contentProps || contentProps.hidden) return anchor;

  return (
    <MuiTooltip
      title={<div className={contentProps.className}>{contentProps.children}</div>}
      placement={contentProps.side ?? 'top'}
      open={open}
      onOpen={() => onOpenChange?.(true)}
      onClose={() => onOpenChange?.(false)}
      enterDelay={delayDuration ?? 300}
    >
      {anchor}
    </MuiTooltip>
  );
}
