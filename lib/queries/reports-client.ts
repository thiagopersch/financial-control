import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ReportChartData {
  name: string;
  value: number;
  fill?: string;
}

export interface ReportTableData {
  category: string;
  value: number;
  percentage: string;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  transactionCount: number;
}

export function useReports(metric: string, period: string) {
  const { data, error, isLoading, mutate } = useSWR<{
    chartData: ReportChartData[];
    tableData: ReportTableData[];
    summary: ReportSummary;
  }>(`/api/reports?metric=${metric}&period=${period}`, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    chartData: data?.chartData || [],
    tableData: data?.tableData || [],
    summary: data?.summary || null,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
