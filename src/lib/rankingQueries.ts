import { queryOptions } from "@tanstack/react-query";
import { getRankingSnapshot } from "./ranking.functions";
import { RANK_REFRESH_MS } from "./publicRanking";

export const rankingQuery = () => queryOptions({
  queryKey: ["public-ranking"],
  queryFn: () => getRankingSnapshot(),
  staleTime: 15_000,
  refetchInterval: RANK_REFRESH_MS,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  retry: 2,
  retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 15_000),
});