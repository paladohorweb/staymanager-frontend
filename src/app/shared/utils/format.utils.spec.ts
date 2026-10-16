import { currency, optimizedImageUrl, shortDate } from './format.utils';

describe('format utilities', () => {
  it('formats Colombian pesos without decimal places', () => {
    expect(currency(250000)).toContain('250.000');
  });

  it('formats an ISO date without changing the calendar day', () => {
    const formatted = shortDate('2026-10-15').toLowerCase();

    expect(formatted).toContain('15');
    expect(formatted).toContain('oct');
    expect(formatted).toContain('2026');
  });

  it('requests optimized WebP images from Unsplash', () => {
    const result = optimizedImageUrl('https://images.unsplash.com/photo-example?q=95', 720);
    expect(result).toContain('fm=webp');
    expect(result).toContain('w=720');
    expect(result).toContain('q=68');
  });
});
