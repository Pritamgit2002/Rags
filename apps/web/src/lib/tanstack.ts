import {
  QueryClient,
  type InvalidateQueryFilters,
} from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0, staleTime: 3000, refetchOnWindowFocus: false },
  },
});

export const invalidateQueries = (filters?: InvalidateQueryFilters) =>
  queryClient.invalidateQueries(filters);
