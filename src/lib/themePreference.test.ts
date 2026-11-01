import { describe, expect, it } from 'vitest';
import { parseTheme, themeStorageKey } from './themePreference';
describe('global theme preferences', () => {
  it('only accepts light and dark', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme('purple')).toBeNull();
  });
  it('isolates owner preferences from other accounts and visitors', () => {
    expect(new Set([themeStorageKey(), themeStorageKey('a'), themeStorageKey('b')]).size).toBe(3);
  });
});