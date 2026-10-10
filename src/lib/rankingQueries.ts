import { queryOptions } from "@tanstack/react-query";
import { getRankingSnapshot } from "./ranking.functions";
import { rankingPollInterval, rankingRetryDelay } from "./rankingConnection";

export const rankingQuery = () => queryOptions({
  queryKey: ["public-ranking"],
  queryFn: () => getRankingSnapshot(),
  staleTime: 15_000,
  refetchInterval: (query) => rankingPollInterval(query.state.fetchFailureCount),
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  retry: 2,
  retryDelay: rankingRetryDelay,
});