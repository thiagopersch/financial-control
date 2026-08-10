'use client';

import * as React from 'react';

type DebugEntry = {
  ts: number;
  type: string;
  target: string;
};

const MAX_ENTRIES = 18;

export function dispatchComboboxDebug(type: string, target: EventTarget | null) {
  if (typeof window === 'undefined') return;
  const el = target as HTMLElement | null;
  const label = el
    ? `${el.tagName?.toLowerCase() ?? '?'}${el.getAttribute?.('data-slot') ? `[${el.getAttribute('data-slot')}]` : ''}`
    : '?';
  window.dispatchEvent(
    new CustomEvent<DebugEntry>('cb-debug', {
      detail: { ts: performance.now(), type, target: label },
    }),
  );
}

export function ComboboxDebugOverlay() {
  const [entries, setEntries] = React.useState<DebugEntry[]>([]);

  React.useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<DebugEntry>).detail;
      setEntries((prev) => [...prev.slice(-(MAX_ENTRIES - 1)), detail]);
    }
    window.addEventListener('cb-debug', handler);
    return () => window.removeEventListener('cb-debug', handler);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        background: 'rgba(0,0,0,0.85)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.4,
        padding: '6px 8px',
        maxHeight: '35vh',
        overflowY: 'auto',
        pointerEvents: 'none',
      }}
    >
      <div style={{ color: '#fff', fontWeight: 'bold' }}>[debug combobox]</div>
      {entries.length === 0 && <div>aguardando eventos...</div>}
      {entries.map((e, i) => (
        <div key={i}>
          {e.ts.toFixed(0)}ms — {e.type} — {e.target}
        </div>
      ))}
    </div>
  );
}
