import { queryOptions } from "@tanstack/react-query";
import { getRankingSnapshot } from "./ranking.functions";

/** Public data refreshes only on route entry or an explicit user action. */
export const rankingLoadPolicy = {
  staleTime: Infinity,
  refetchInterval: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retryOnMount: false,
  retry: false,
  networkMode: "always",
} as const;

export const rankingQuery = () => queryOptions({
  queryKey: ["public-ranking"],
  queryFn: () => getRankingSnapshot(),
  ...rankingLoadPolicy,
});