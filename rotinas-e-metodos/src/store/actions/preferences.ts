import type { AppState, CalendarArea, CalendarView, TaskView, Theme } from '../../types/state';

export function setTaskView(draft: AppState, view: TaskView): void {
  draft.preferences.taskView = view;
}

export function setCalendarView(draft: AppState, view: CalendarView): void {
  draft.preferences.calendarView = view;
}

export function setCalendarArea(draft: AppState, area: CalendarArea): void {
  draft.preferences.calendarArea = area;
}

export function setTheme(draft: AppState, theme: Theme): void {
  draft.theme = theme;
}
