export function parseRnbField(rawValue) {
  if (!rawValue || rawValue === '[]') {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue.filter(Boolean);
  }

  const asString = String(rawValue).trim();
  const matches = asString.match(/[A-Z0-9]{12}/g);
  return matches ? [...new Set(matches)] : [];
}
