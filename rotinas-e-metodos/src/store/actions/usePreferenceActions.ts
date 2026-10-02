import { useMemo } from 'react';
import type { CalendarArea, CalendarView, Theme } from '../../types/state';
import { useStore } from '../StoreContext';
import { setCalendarArea, setCalendarView, setTheme } from './preferences';

/** Preferências de tela (tema, calendário), já ligadas ao store. */
export function usePreferenceActions() {
  const store = useStore();
  return useMemo(
    () => ({
      setCalendarView: (view: CalendarView) => store.update((d) => setCalendarView(d, view)),
      setCalendarArea: (area: CalendarArea) => store.update((d) => setCalendarArea(d, area)),
      setTheme: (theme: Theme) => store.update((d) => setTheme(d, theme)),
    }),
    [store],
  );
}
