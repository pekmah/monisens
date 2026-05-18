import { QueryClient } from "@tanstack/react-query";

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
