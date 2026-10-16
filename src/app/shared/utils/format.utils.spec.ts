import { currency, shortDate } from './format.utils';

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
});
