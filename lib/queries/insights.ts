import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  value?: number;
  percentage?: number;
  severity?: 'info' | 'warning' | 'alert';
  createdAt: string;
}

export interface CategoryComparison {
  category: string;
  currentMonth: number;
  previousMonth: number;
  change: number;
  color: string;
}

export interface SpendingHighlight {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

export interface InsightsSummary {
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  previousIncome: number;
  previousExpense: number;
  previousNetResult: number;
}

interface InsightsResponse {
  insights: Insight[];
  summary: InsightsSummary;
  comparisons: CategoryComparison[];
  highlights: SpendingHighlight[];
}

export function useInsights() {
  const { data, error, isLoading } = useSWR<InsightsResponse>('/api/insights', fetcher, {
    revalidateOnFocus: false,
  });

  return {
    insights: data?.insights || [],
    summary: data?.summary || null,
    comparisons: data?.comparisons || [],
    highlights: data?.highlights || [],
    isLoading,
    isError: error,
  };
}
