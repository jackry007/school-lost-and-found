// utils/unique.ts
export const normalize = (s: string) => s.trim().toLowerCase();

/** Dedupes by normalized value but preserves the first label’s casing */
export const uniqueLabels = (labels: string[]) =>
  Array.from(new Map(labels.map((l) => [normalize(l), l.trim()])).values());
