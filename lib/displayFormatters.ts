/**
 * House-brand prefixes that add nothing when you are standing in the aisle.
 * "Kirkland Signature Organic Olive Oil" reads better as "Organic Olive Oil".
 */
const HOUSE_BRAND_PATTERNS: readonly RegExp[] = [
  /\bkirkland\s+signature\b/gi,
  /\bkirkland\b/gi,
  /\bsprouts\s+farmers\s+market\b/gi,
  /\bsprouts\s+brand\b/gi,
  /\bsprouts\b/gi,
  /\btrader\s+joe(?:'|’)?s\b/gi,
];

export function stripStoreBrandForDisplay(name: string) {
  const stripped = HOUSE_BRAND_PATTERNS.reduce(
    (value, pattern) => value.replace(pattern, ""),
    name
  )
    .replace(/^[\s:–—-]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return stripped.length > 0 ? stripped : name;
}
