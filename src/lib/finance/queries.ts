import { useQuery } from "@tanstack/react-query";

import { loadCategoriesUseCase } from "@/lib/finance/use-cases";

export const financeQueryKeys = {
  all: ["finance"] as const,
  categories: () => [...financeQueryKeys.all, "categories"] as const,
};

export function useCategoriesQuery() {
  return useQuery({
    queryKey: financeQueryKeys.categories(),
    queryFn: loadCategoriesUseCase,
  });
}
