import { z } from 'zod';
import { OWNER_TYPES, WEEKDAYS } from '../types/common';
import { BLOCKER_STATUSES, QUESTION_STATUSES } from '../types/sections';
import type { AppState } from '../types/state';
import { CALENDAR_AREAS, CALENDAR_VIEWS, TASK_VIEWS, THEMES } from '../types/state';
import { TOPIC_STATUSES } from '../types/study';
import { PRIORITIES, TASK_STATUSES } from '../types/work';

// Valida o JSON lido do localStorage (e, na Etapa 7, o arquivo importado).
// Faz o papel do "hidratação defensiva" do loadState do Template: campos que
// faltarem recebem um valor padrão, então dados salvos por uma versão mais
// antiga do app continuam abrindo. O que não tem padrão (ids, vínculos,
// estrutura) precisa estar correto, senão o estado inteiro é recusado.
//
// A anotação z.ZodType<AppState> faz o TypeScript acusar se este schema e os
// tipos em src/types/ deixarem de bater.

const FALLBACK_COLOR = '#64748b';

const text = () => z.string().default('');
const optionalDate = () => z.string().nullable().default(null);
const list = <T extends z.ZodType>(item: T) => z.array(item).default(() => []);

const baseEntity = {
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
};

const ownerRef = {
  ownerType: z.enum(OWNER_TYPES),
  ownerId: z.string().min(1),
};

const recurrenceSchema = z.discriminatedUnion('freq', [
  z.object({ freq: z.literal('daily') }),
  z.object({ freq: z.literal('weekly'), weekdays: z.array(z.literal([...WEEKDAYS])).min(1) }),
  z.object({ freq: z.literal('monthly') }),
]);

const projectSchema = z.object({
  ...baseEntity,
  name: z.string(),
  description: text(),
  color: z.string().default(FALLBACK_COLOR),
  startDate: optionalDate(),
  dueDate: optionalDate(),
  notes: text(),
});

const subtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  done: z.boolean().default(false),
});

const taskSchema = z.object({
  ...baseEntity,
  projectId: z.string().min(1),
  title: z.string(),
  description: text(),
  status: z.enum(TASK_STATUSES).default('todo'),
  priority: z.enum(PRIORITIES).default('medium'),
  dueDate: optionalDate(),
  tags: list(z.string()),
  subtasks: list(subtaskSchema),
  notes: text(),
  recurrence: recurrenceSchema.nullable().default(null),
  completedOccurrences: list(z.string()),
  order: z.number().default(0),
});

const subjectSchema = z.object({
  ...baseEntity,
  name: z.string(),
  description: text(),
  color: z.string().default(FALLBACK_COLOR),
});

const topicSchema = z.object({
  ...baseEntity,
  subjectId: z.string().min(1),
  title: z.string(),
  status: z.enum(TOPIC_STATUSES).default('not_started'),
  plannedDate: optionalDate(),
  recurrence: recurrenceSchema.nullable().default(null),
  completedOccurrences: list(z.string()),
  notes: text(),
  order: z.number().default(0),
});

const ideaSchema = z.object({
  ...baseEntity,
  ...ownerRef,
  title: z.string(),
  description: text(),
  date: z.string(),
});

const blockerSchema = z.object({
  ...baseEntity,
  ...ownerRef,
  description: z.string(),
  status: z.enum(BLOCKER_STATUSES).default('active'),
  resolvedOn: optionalDate(),
});

const progressLogSchema = z.object({
  ...baseEntity,
  ...ownerRef,
  date: z.string(),
  content: z.string(),
});

const questionSchema = z.object({
  ...baseEntity,
  ownerType: z.literal('topic'),
  ownerId: z.string().min(1),
  question: z.string(),
  answer: text(),
  status: z.enum(QUESTION_STATUSES).default('open'),
  answeredOn: optionalDate(),
});

const preferencesSchema = z.object({
  taskView: z.enum(TASK_VIEWS).default('kanban'),
  calendarView: z.enum(CALENDAR_VIEWS).default('month'),
  calendarArea: z.enum(CALENDAR_AREAS).default('all'),
});

export const appStateSchema: z.ZodType<AppState> = z.object({
  schemaVersion: z.literal(1),
  theme: z.enum(THEMES).default('light'),
  // Campos novos (Etapas 3 e 6): estados salvos antes deles ganham os padrões.
  preferences: preferencesSchema.default(() => ({
    taskView: 'kanban' as const,
    calendarView: 'month' as const,
    calendarArea: 'all' as const,
  })),
  projects: list(projectSchema),
  tasks: list(taskSchema),
  subjects: list(subjectSchema),
  topics: list(topicSchema),
  ideas: list(ideaSchema),
  blockers: list(blockerSchema),
  progressLogs: list(progressLogSchema),
  questions: list(questionSchema),
});
