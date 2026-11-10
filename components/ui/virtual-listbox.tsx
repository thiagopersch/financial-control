'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import * as React from 'react';

/** Acima disso a lista de opções do Autocomplete passa a ser virtualizada. */
export const VIRTUALIZE_OPTIONS_THRESHOLD = 50;
const ITEM_HEIGHT = 36;
const MAX_HEIGHT = 320;

/**
 * Listbox virtualizado para o MUI `Autocomplete`: só as opções visíveis vão
 * para o DOM (listas com centenas de categorias/fornecedores ficam leves).
 */
export const VirtualListbox = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLElement>>(
  function VirtualListbox({ children, style, ...props }, ref) {
    const items = React.Children.toArray(children);
    const parentRef = React.useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => ITEM_HEIGHT,
      overscan: 8,
    });

    return (
      <div ref={parentRef} style={{ maxHeight: MAX_HEIGHT, overflow: 'auto' }}>
        <ul
          ref={ref}
          {...props}
          style={{
            ...style,
            height: virtualizer.getTotalSize(),
            position: 'relative',
            margin: 0,
            padding: 0,
            maxHeight: 'none',
            overflow: 'visible',
          }}
        >
          {virtualizer.getVirtualItems().map((row) => (
            <div
              key={row.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: ITEM_HEIGHT,
                transform: `translateY(${row.start}px)`,
              }}
            >
              {items[row.index]}
            </div>
          ))}
        </ul>
      </div>
    );
  },
);
