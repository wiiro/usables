import type { ISODateTime } from './common';
import type { Subject, Topic } from './study';
import type { Blocker, Idea, ProgressLog, Question } from './sections';
import type { Project, Task } from './work';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const TASK_VIEWS = ['kanban', 'list'] as const;
export type TaskView = (typeof TASK_VIEWS)[number];

export const CALENDAR_VIEWS = ['month', 'week', 'day'] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

/** O que o calendário geral mostra: tudo, só Trabalho ou só Estudos. */
export const CALENDAR_AREAS = ['all', 'work', 'study'] as const;
export type CalendarArea = (typeof CALENDAR_AREAS)[number];

/** Escolhas de tela que valem a pena lembrar entre uma sessão e outra. */
export interface Preferences {
  taskView: TaskView;
  calendarView: CalendarView;
  calendarArea: CalendarArea;
}

/**
 * O estado inteiro do app, gravado como um único JSON no localStorage
 * (mesmo esquema do Template). As coleções são listas planas ligadas por id:
 * Task.projectId → Project, Topic.subjectId → Subject, OwnerRef → dono da seção.
 */
export interface AppState {
  /** Sobe quando o formato muda; o carregamento converte versões antigas. */
  schemaVersion: 1;
  theme: Theme;
  preferences: Preferences;
  projects: Project[];
  tasks: Task[];
  subjects: Subject[];
  topics: Topic[];
  ideas: Idea[];
  blockers: Blocker[];
  progressLogs: ProgressLog[];
  questions: Question[];
}

/** Formato do arquivo de backup (botões Exportar / Importar). */
export interface BackupFile {
  app: 'rotinas-e-metodos';
  exportedAt: ISODateTime;
  state: AppState;
}
