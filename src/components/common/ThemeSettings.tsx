import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
export function ThemeSettings() {
  const {theme, setTheme} = useTheme();
  return <section className="space-y-3 border-b border-border pb-5"><h2 className="font-display text-base font-semibold">Aparência</h2><div className="flex gap-2" role="group" aria-label="Tema"><Button size="sm" variant={theme === 'light' ? 'default' : 'outline'} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Sun className="h-4 w-4"/> Tema claro</Button><Button size="sm" variant={theme === 'dark' ? 'default' : 'outline'} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon className="h-4 w-4"/> Tema escuro</Button></div></section>;
}