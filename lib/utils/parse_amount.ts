/**
 * Parse a paid_amount string into a number.
 * Handles formats:
 *  - "35000"        → 35000   (raw number from webhook)
 *  - "35000.50"     → 35000.5 (raw with decimals)
 *  - "35.000$"      → 35000   (Argentine thousands separator)
 *  - "35.000,50$"   → 35000.5 (Argentine full format)
 *  - "$35,000.00"   → 35000   (US format)
 */
export function parseAmount(amount: string | null | undefined): number {
  if (!amount) return 0;

  // Strip currency symbols, spaces, letters
  const cleaned = amount.replace(/[^0-9.,]/g, "").trim();
  if (!cleaned) return 0;

  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  // Both dot and comma present — figure out which is the decimal separator
  if (hasDot && hasComma) {
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");

    if (lastComma > lastDot) {
      // Format: 35.000,50 (dot=thousands, comma=decimal)
      return parseFloat(cleaned.replace(/\./g, "").replace(",", ".")) || 0;
    } else {
      // Format: 35,000.50 (comma=thousands, dot=decimal)
      return parseFloat(cleaned.replace(/,/g, "")) || 0;
    }
  }

  // Only dot — check if it's a thousands separator or decimal
  if (hasDot && !hasComma) {
    const parts = cleaned.split(".");
    // If last segment has exactly 3 digits → thousands separator (e.g. "35.000")
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      return parseFloat(parts.join("")) || 0;
    }
    // Otherwise it's a decimal dot (e.g. "35000.50")
    return parseFloat(cleaned) || 0;
  }

  // Only comma — check if decimal
  if (hasComma && !hasDot) {
    const parts = cleaned.split(",");
    if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal comma: "35000,50"
      return parseFloat(cleaned.replace(",", ".")) || 0;
    }
    // Thousands comma: "35,000"
    return parseFloat(cleaned.replace(/,/g, "")) || 0;
  }

  // Plain number
  return parseFloat(cleaned) || 0;
}
