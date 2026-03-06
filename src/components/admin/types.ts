export const QUEUE_FILTERS = [
  "all",
  "pending",
  "listed",
  "on_hold",
  "claimed",
  "rejected",
] as const;

export type StatusFilter = (typeof QUEUE_FILTERS)[number];
