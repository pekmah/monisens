export function normalizeMerchantKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || null;
}

export function normalizeCategoryProposalName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function normalizeLabelKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CATEGORY_ALIAS_TO_DEFAULT_ID: Record<string, string> = {
  airtime: "cat-bills",
  beauty: "cat-personal",
  bills: "cat-bills",
  dining: "cat-food",
  education: "cat-other",
  electricity: "cat-bills",
  fees: "cat-other",
  food: "cat-food",
  fuel: "cat-transport",
  groceries: "cat-food",
  grocery: "cat-food",
  hospital: "cat-health",
  internet: "cat-bills",
  leisure: "cat-entertainment",
  medical: "cat-health",
  medicine: "cat-health",
  misc: "cat-other",
  miscellaneous: "cat-other",
  movies: "cat-entertainment",
  personal: "cat-personal",
  pharmacy: "cat-health",
  rent: "cat-bills",
  restaurant: "cat-food",
  salary: "cat-income",
  school: "cat-other",
  shopping: "cat-shopping",
  supermarket: "cat-food",
  taxi: "cat-transport",
  transfer: "cat-savings",
  transport: "cat-transport",
  travel: "cat-transport",
  uncategorized: "cat-other",
  utilities: "cat-bills",
  utility: "cat-bills",
  water: "cat-bills",
};

export function resolveCategoryFromSuggestion<T extends { id: string; label: string }>(
  categories: T[],
  suggestedCategory: string | null | undefined,
) {
  if (!suggestedCategory) {
    return null;
  }

  const normalizedSuggestion = normalizeLabelKey(suggestedCategory);
  const directMatch =
    categories.find((entry) => normalizeLabelKey(entry.label) === normalizedSuggestion) ?? null;

  if (directMatch) {
    return directMatch;
  }

  const aliasId = CATEGORY_ALIAS_TO_DEFAULT_ID[normalizedSuggestion];
  if (aliasId) {
    return categories.find((entry) => entry.id === aliasId) ?? null;
  }

  for (const [alias, defaultId] of Object.entries(CATEGORY_ALIAS_TO_DEFAULT_ID)) {
    if (
      normalizedSuggestion.includes(alias) ||
      alias.includes(normalizedSuggestion)
    ) {
      return categories.find((entry) => entry.id === defaultId) ?? null;
    }
  }

  return null;
}
