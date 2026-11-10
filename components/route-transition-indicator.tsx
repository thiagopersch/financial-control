'use client';

import LinearProgress from '@mui/material/LinearProgress';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function isInternalNavigationClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  const anchor = (event.target as HTMLElement | null)?.closest('a');
  if (!anchor) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }

  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }

  return true;
}

/**
 * Barra de progresso no topo durante a navegação (MUI `LinearProgress`
 * indeterminado). Só muda de estado ao começar e ao terminar — antes um
 * `setInterval` atualizava o progresso a cada 250ms.
 */
export function RouteTransitionIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isInternalNavigationClick(event)) setVisible(true);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- navegação concluída
    setVisible(false);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <LinearProgress
      aria-label="Carregando página"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1600,
        height: 3,
        borderRadius: 0,
      }}
    />
  );
}
