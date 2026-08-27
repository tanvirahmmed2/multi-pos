export const CURRENCY_OPTIONS = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka (৳)' },
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar ($)' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar ($)' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (د.إ)' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal (﷼)' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee (Rs)' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit (RM)' },
  { code: 'SGD', symbol: '$', name: 'Singapore Dollar ($)' }
];

export const DEFAULT_CURRENCY_SYMBOL = '৳';
export const DEFAULT_CURRENCY_CODE = 'BDT';

/**
 * Formats a numeric value into a currency formatted string.
 * @param {number|string} val - The amount to format.
 * @param {string} [symbol] - Currency symbol (defaults to '৳').
 * @returns {string} Formatted currency string.
 */
export function formatCurrency(val, symbol = DEFAULT_CURRENCY_SYMBOL) {
  const num = parseFloat(val) || 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${symbol || DEFAULT_CURRENCY_SYMBOL}${formatted}`;
}

/**
 * Extract currency symbol from website settings object.
 * @param {object} [website] - Website settings object.
 * @returns {string} Currency symbol.
 */
export function getCurrencySymbol(website) {
  return website?.currency_symbol || DEFAULT_CURRENCY_SYMBOL;
}

/**
 * Extract currency code from website settings object.
 * @param {object} [website] - Website settings object.
 * @returns {string} Currency code.
 */
export function getCurrencyCode(website) {
  return website?.currency_code || DEFAULT_CURRENCY_CODE;
}
