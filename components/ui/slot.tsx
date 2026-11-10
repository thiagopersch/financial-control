'use client';

import * as React from 'react';

type AnyProps = Record<string, unknown>;

function mergeHandlers(a: unknown, b: unknown) {
  if (typeof a !== 'function') return b;
  if (typeof b !== 'function') return a;
  return (...args: unknown[]) => {
    (b as (...x: unknown[]) => void)(...args);
    (a as (...x: unknown[]) => void)(...args);
  };
}

/** Junta refs (callback e objeto) num único callback ref. */
export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(value);
      else if (ref) (ref as React.RefObject<T | null>).current = value;
    }
  };
}

/**
 * Equivalente ao `asChild`/Slot do Radix: repassa props (handlers combinados,
 * `className` concatenado, ref) para o único filho em vez de renderizar um
 * elemento próprio. Mantém compatível o código que usava `<X asChild><Link/></X>`.
 */
export const Slot = React.forwardRef<HTMLElement, AnyProps & { children?: React.ReactNode }>(
  function Slot({ children, ...slotProps }, ref) {
    if (!React.isValidElement(children)) return null;
    const child = children as React.ReactElement<AnyProps & { ref?: React.Ref<HTMLElement> }>;
    const childProps = child.props;
    const merged: AnyProps = { ...slotProps, ...childProps };
    for (const key of Object.keys(slotProps)) {
      if (/^on[A-Z]/.test(key)) merged[key] = mergeHandlers(childProps[key], slotProps[key]);
    }
    if (slotProps.className || childProps.className) {
      merged.className = [slotProps.className, childProps.className].filter(Boolean).join(' ');
    }
    if (slotProps.style || childProps.style) {
      merged.style = { ...(slotProps.style as object), ...(childProps.style as object) };
    }
    const childRef = (childProps.ref ??
      (child as unknown as { ref?: React.Ref<HTMLElement> }).ref) as
      React.Ref<HTMLElement> | undefined;
    merged.ref = mergeRefs(ref, childRef);
    return React.cloneElement(child, merged);
  },
);

/** Estado aberto/fechado controlado ou não-controlado (padrão dos componentes Radix). */
export function useControllableOpen(
  open: boolean | undefined,
  defaultOpen: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  const [internal, setInternal] = React.useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const value = isControlled ? open : internal;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );
  return [value, setOpen] as const;
}
