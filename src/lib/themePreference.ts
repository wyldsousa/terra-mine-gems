export type AppTheme = 'light' | 'dark';
export function parseTheme(value: unknown): AppTheme | null {
  return value === 'light' || value === 'dark' ? value : null;
}
export function themeStorageKey(userId?: string) {
  return `calculator-theme-v1:${userId ? `owner:${userId}` : 'guest'}`;
}