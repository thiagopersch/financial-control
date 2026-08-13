'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartVisualType } from './chart-type-switcher';

interface Series {
  dataKey: string;
  name: string;
  color: string;
}

interface ChartAltRendererProps {
  type: Exclude<ChartVisualType, 'default'>;
  data: any[];
  series: Series[];
  xKey?: string;
  tooltipFormatter?: (value: number) => string;
  axisFormatter?: (value: number) => string;
  pieColorKey?: string;
}

const tooltipStyle = {
  borderRadius: '8px',
  border: 'none',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

export function ChartAltRenderer({
  type,
  data,
  series,
  xKey = 'name',
  tooltipFormatter,
  axisFormatter,
  pieColorKey = 'color',
}: ChartAltRendererProps) {
  const formatTooltip = (value: any) =>
    tooltipFormatter ? tooltipFormatter(Number(value)) : String(value);
  const formatAxis = (value: any) => (axisFormatter ? axisFormatter(Number(value)) : String(value));

  if (type === 'pie' || type === 'donut') {
    const pieData =
      series.length > 1
        ? series.map((s) => ({
            name: s.name,
            value: data.reduce((sum, d) => sum + Number(d[s.dataKey] || 0), 0),
            color: s.color,
          }))
        : data.map((d) => ({
            name: d[xKey],
            value: Number(d[series[0]?.dataKey] ?? 0),
            color: d[pieColorKey] || series[0]?.color,
          }));

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={type === 'donut' ? 60 : 0}
            outerRadius={80}
            paddingAngle={type === 'donut' ? 5 : 2}
            dataKey="value"
          >
            {pieData.map((entry, i) => (
              <Cell key={i} fill={entry.color || '#6366f1'} />
            ))}
          </Pie>
          <Tooltip formatter={(v: any) => formatTooltip(v)} contentStyle={tooltipStyle} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey={xKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatAxis}
          />
          <Tooltip formatter={(v: any) => formatTooltip(v)} contentStyle={tooltipStyle} />
          {series.length > 1 && <Legend verticalAlign="top" height={36} iconType="circle" />}
          {series.map((s) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              stroke={s.color}
              name={s.name}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  const isHorizontal = type === 'bar-horizontal';
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
        margin={isHorizontal ? { left: 16, right: 16 } : undefined}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={isHorizontal}
          horizontal={!isHorizontal}
          stroke="#f1f5f9"
        />
        {isHorizontal ? (
          <>
            <XAxis
              type="number"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxis}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={90}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxis}
            />
          </>
        )}
        <Tooltip
          formatter={(v: any) => formatTooltip(v)}
          contentStyle={tooltipStyle}
          cursor={{ fill: '#f8fafc' }}
        />
        {series.length > 1 && <Legend verticalAlign="top" height={36} iconType="circle" />}
        {series.map((s) => (
          <Bar
            key={s.dataKey}
            dataKey={s.dataKey}
            fill={s.color}
            radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            barSize={isHorizontal ? 16 : 20}
            name={s.name}
          >
            {series.length === 1 &&
              data.some((d) => d[pieColorKey]) &&
              data.map((entry, i) => <Cell key={i} fill={entry[pieColorKey] || s.color} />)}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
