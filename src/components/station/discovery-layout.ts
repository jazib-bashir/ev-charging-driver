/**
 * Shared discovery / home layout rhythm.
 * Keep edge inset and section gaps consistent across header → list.
 */
export const DISCOVERY_LAYOUT = {
  edge: 20,
  sectionGap: 12,
  cardGap: 14,
  searchHeight: 45,
  chipHeight: 30,
  /** Extra space under the last station card so scroll doesn’t feel clipped. */
  listBottomPad: 40,
} as const;
