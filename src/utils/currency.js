// Currency symbols and formatting
export const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BDT: '৳',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$'
};

export const getCurrencySymbol = (currencyCode = 'USD') => {
  return currencySymbols[currencyCode] || '$';
};

export const formatPrice = (price, currency = 'USD') => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${parseFloat(price).toFixed(2)}`;
};
