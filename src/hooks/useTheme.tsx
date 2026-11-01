import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { parseTheme, themeStorageKey, type AppTheme } from '@/lib/themePreference';

const ThemeContext = createContext<{theme: AppTheme; setTheme: (theme: AppTheme) => void} | null>(null);
export function ThemeProvider({children}: {children: ReactNode}) {
  const {user, loading} = useAuth();
  const [theme, update] = useState<AppTheme>('dark');
  const revision = useRef(0);
  useEffect(() => {
    if (loading) return;
    let active = true;
    const version = ++revision.current;
    let saved: AppTheme = 'dark';
    try { saved = parseTheme(localStorage.getItem(themeStorageKey(user?.id))) ?? 'dark'; } catch { /* local storage unavailable */ }
    update(saved);
    if (user) void supabase.from('profiles').select('theme_preference').eq('id', user.id).maybeSingle().then(({data, error}) => {
      if (!active || revision.current !== version) return;
      const remote = parseTheme(data?.theme_preference);
      if (error) return;
      if (remote) {
        update(remote);
        try { localStorage.setItem(themeStorageKey(user.id), remote); } catch { /* keep applied preference */ }
      }
    });
    return () => { active = false; };
  }, [user?.id, loading]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  const setTheme = (next: AppTheme) => {
    revision.current++;
    update(next);
    try { localStorage.setItem(themeStorageKey(user?.id), next); } catch { toast.error('Não foi possível salvar o tema neste dispositivo.'); }
    if (user) void supabase.from('profiles').upsert({id: user.id, theme_preference: next}, {onConflict: 'id'}).then(({error}) => {
      if (error) toast.error('Tema aplicado neste dispositivo; não foi possível salvar na conta.');
    });
  };
  return <ThemeContext.Provider value={{theme, setTheme}}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('ThemeProvider required');
  return value;
}