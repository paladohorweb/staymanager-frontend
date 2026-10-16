export const currency = (value: number): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export const shortDate = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(year, month - 1, day));
};

export const optimizedImageUrl = (value: string, width = 960): string => {
  if (!value.includes('images.unsplash.com')) return value;
  try {
    const url = new URL(value);
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('fm', 'webp');
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', '68');
    return url.toString();
  } catch {
    return value;
  }
};
