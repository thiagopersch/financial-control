import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  value?: number;
  percentage?: number;
  severity?: "info" | "warning" | "alert";
  createdAt: string;
}

export function useInsights() {
  const { data, error, isLoading } = useSWR<{ insights: Insight[] }>("/api/insights", fetcher, {
    revalidateOnFocus: false,
  });

  return {
    insights: data?.insights || [],
    isLoading,
    isError: error,
  };
}
