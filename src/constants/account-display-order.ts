export const ACCOUNT_DISPLAY_ORDER = [
  "VV02",
  "VV03",
  "VV04",
  "VV07",
  "VV09",
  "VV10",
  "VV14",
  "VV15",
  "PNR1",
  "PNR2",
  "PNR4",
  "PNR5",
  "PNR6",
  "PNR8",
  "FSA1",
  "FSA2",
  "FSA3",
  "FSA4",
  "FSA5",
  "FSA6",
  "FSA7",
  "PRI1",
  "PRI2",
  "PRI3",
  "FLA1",
  "FLA2",
  "EE01",
  "EE02",
  "EE03",
  "CAM1",
  "CAM2",
  "CAM3",
  "CAM5",
  "CAM7",
  "EC01",
  "EC02",
  "EC03",
] as const;

const ACCOUNT_DISPLAY_ORDER_INDEX = new Map<string, number>(
  ACCOUNT_DISPLAY_ORDER.map((accountId, index) => [accountId, index]),
);

export function compareByAccountDisplayOrder(
  a: { accountId: string },
  b: { accountId: string },
) {
  const aIndex =
    ACCOUNT_DISPLAY_ORDER_INDEX.get(a.accountId) ?? Number.MAX_SAFE_INTEGER;
  const bIndex =
    ACCOUNT_DISPLAY_ORDER_INDEX.get(b.accountId) ?? Number.MAX_SAFE_INTEGER;

  if (aIndex !== bIndex) {
    return aIndex - bIndex;
  }

  return a.accountId.localeCompare(b.accountId);
}
