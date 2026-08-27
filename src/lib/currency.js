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

export function formatCurrency(val, symbol = DEFAULT_CURRENCY_SYMBOL) {
  const num = parseFloat(val) || 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${symbol || DEFAULT_CURRENCY_SYMBOL}${formatted}`;
}

export function getCurrencySymbol(website) {
  return website?.currency_symbol || DEFAULT_CURRENCY_SYMBOL;
}

export function getCurrencyCode(website) {
  return website?.currency_code || DEFAULT_CURRENCY_CODE;
}
