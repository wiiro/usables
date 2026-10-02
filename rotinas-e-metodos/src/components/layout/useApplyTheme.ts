import { useEffect } from 'react';
import type { Theme } from '../../types/state';

/** Mantém a classe .dark do <html> igual ao tema salvo no estado. */
export function useApplyTheme(theme: Theme): void {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
}
