import { formatCurrency } from '@/lib/utils';
import { ImageResponse } from 'next/og';

/**
 * Server-side PNG charts for report e-mails. Uses next/og (Satori + Resvg,
 * bundled with Next — no native binaries), rendered at 2x so they stay sharp
 * when the e-mail shows them at CHART_DISPLAY_WIDTH. Returned as Buffers to be
 * attached inline (`cid:`), since nodemailer runs with URL/file access disabled.
 */

export const CHART_DISPLAY_WIDTH = 560;
const SCALE = 2;
const PRIMARY = '#007a55';
const FALLBACK_COLORS = ['#007a55', '#2563eb', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

async function toPng(element: React.ReactElement, height: number): Promise<Buffer> {
  const response = new ImageResponse(element, { width: CHART_DISPLAY_WIDTH * SCALE, height });
  return Buffer.from(await response.arrayBuffer());
}

function compactCurrency(value: number) {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1).replace('.', ',')} mil`;
  return formatCurrency(value);
}

/** Horizontal bars, one per category (top 6 + "Outros"). */
export async function renderCategoryBarChart(
  data: { name: string; color: string; value: number }[],
): Promise<Buffer> {
  const top = data.slice(0, 6);
  const rest = data.slice(6).reduce((acc, d) => acc + d.value, 0);
  const rows = rest > 0 ? [...top, { name: 'Outros', color: '#94a3b8', value: rest }] : top;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((acc, r) => acc + r.value, 0) || 1;
  const rowHeight = 64;
  const height = Math.max(rows.length, 1) * rowHeight + 48;

  return toPng(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '24px 32px',
        fontSize: 26,
        color: '#1a1a1a',
      }}
    >
      {rows.length === 0 ? (
        <div style={{ display: 'flex', color: '#64748b' }}>Sem despesas no período</div>
      ) : (
        rows.map((row, i) => (
          <div
            key={row.name}
            style={{ display: 'flex', alignItems: 'center', height: rowHeight, gap: 16 }}
          >
            <div style={{ display: 'flex', width: 260, overflow: 'hidden' }}>{row.name}</div>
            <div style={{ display: 'flex', flex: 1, height: 28 }}>
              <div
                style={{
                  display: 'flex',
                  width: `${Math.max((row.value / max) * 100, 1)}%`,
                  height: '100%',
                  borderRadius: 6,
                  backgroundColor: row.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                }}
              />
            </div>
            <div style={{ display: 'flex', width: 260, justifyContent: 'flex-end' }}>
              {`${formatCurrency(row.value)} · ${Math.round((row.value / total) * 100)}%`}
            </div>
          </div>
        ))
      )}
    </div>,
    height,
  );
}

/** Vertical columns, one per day of the period. */
export async function renderDailyColumnChart(
  data: { label: string; value: number }[],
): Promise<Buffer> {
  const max = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = 320;
  const height = chartHeight + 140;
  const showValues = data.length <= 14;

  return toPng(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        padding: '24px 32px',
        fontSize: 22,
        color: '#1a1a1a',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: chartHeight + 40,
          gap: 8,
          borderBottom: '2px solid #e2e8f0',
        }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
            }}
          >
            {showValues && d.value > 0 && (
              <div style={{ display: 'flex', fontSize: 18, color: '#475569', marginBottom: 6 }}>
                {compactCurrency(d.value)}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                width: '70%',
                height: Math.max((d.value / max) * chartHeight, d.value > 0 ? 4 : 0),
                backgroundColor: PRIMARY,
                borderRadius: '6px 6px 0 0',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flex: 1,
              justifyContent: 'center',
              color: '#64748b',
              fontSize: data.length > 14 ? 14 : 20,
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>,
    height,
  );
}
