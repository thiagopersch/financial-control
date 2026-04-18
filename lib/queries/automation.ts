import useSWR from "swr";
import {
  createConditionalRule,
  deleteConditionalRule,
  toggleConditionalRule,
} from "@/lib/actions/conditional-rules";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ConditionalRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  priority: number;
  conditions: any;
  actions: any;
  createdAt: string;
}

export function useConditionalRules() {
  const { data, error, isLoading, mutate } = useSWR<{ rules: ConditionalRule[] }>(
    "/api/conditional-rules",
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  return {
    rules: data?.rules || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
