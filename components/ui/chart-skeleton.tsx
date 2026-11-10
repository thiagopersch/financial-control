'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

/**
 * Skeleton com o formato de um gráfico de barras (eixo + colunas), usado
 * enquanto os dados do gráfico carregam — substitui o spinner genérico.
 */
const BAR_HEIGHTS = [55, 80, 40, 95, 65, 75, 50, 85];

export function ChartSkeleton({ height = 400, bars = 8 }: { height?: number; bars?: number }) {
  return (
    <Box
      role="status"
      aria-label="Carregando gráfico"
      sx={{ height, display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}
    >
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 1.5, px: 1 }}>
        {Array.from({ length: bars }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            sx={{ flex: 1, height: `${BAR_HEIGHTS[i % BAR_HEIGHTS.length]}%`, transform: 'none' }}
          />
        ))}
      </Box>
      <Skeleton variant="text" sx={{ width: '100%', height: 16 }} />
    </Box>
  );
}
