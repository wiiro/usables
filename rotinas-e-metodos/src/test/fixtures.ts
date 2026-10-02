import type { AppState } from '../types/state';
import type { Task } from '../types/work';

const STAMP = '2026-10-01T12:00:00.000Z';

/** Tarefa com valores neutros; o teste só informa o que importa para ele. */
export function makeTask(overrides: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    createdAt: STAMP, updatedAt: STAMP, projectId: 'p1', title: overrides.id, description: '',
    status: 'todo', priority: 'medium', dueDate: null, tags: [], subtasks: [], notes: '',
    recurrence: null, completedOccurrences: [], order: 0,
    ...overrides,
  };
}

/** Um estado com um item de cada coleção, para testes. */
export function sampleState(): AppState {
  return {
    schemaVersion: 1,
    theme: 'light',
    preferences: { taskView: 'kanban', calendarView: 'month', calendarArea: 'all' },
    projects: [
      {
        id: 'p1', createdAt: STAMP, updatedAt: STAMP,
        name: 'Projeto A', description: '', color: '#2563eb',
        startDate: '2026-10-01', dueDate: '2026-12-15', notes: '# Notas',
      },
    ],
    tasks: [
      {
        id: 't1', createdAt: STAMP, updatedAt: STAMP, projectId: 'p1',
        title: 'Tarefa 1', description: '', status: 'doing', priority: 'high',
        dueDate: '2026-10-10', tags: ['api'],
        subtasks: [{ id: 's1', title: 'Passo 1', done: true }],
        notes: '', recurrence: { freq: 'weekly', weekdays: [1, 3] },
        completedOccurrences: ['2026-10-06'], order: 1,
      },
    ],
    subjects: [
      { id: 'm1', createdAt: STAMP, updatedAt: STAMP, name: 'Matéria A', description: '', color: '#059669' },
    ],
    topics: [
      {
        id: 'k1', createdAt: STAMP, updatedAt: STAMP, subjectId: 'm1',
        title: 'Tópico 1', status: 'studying', plannedDate: null,
        recurrence: null, completedOccurrences: [], notes: '', order: 1,
      },
    ],
    ideas: [
      { id: 'i1', createdAt: STAMP, updatedAt: STAMP, ownerType: 'project', ownerId: 'p1', title: 'Ideia', description: '', date: '2026-10-01' },
    ],
    blockers: [
      { id: 'b1', createdAt: STAMP, updatedAt: STAMP, ownerType: 'task', ownerId: 't1', description: 'Esperando acesso', status: 'active', resolvedOn: null },
    ],
    progressLogs: [
      { id: 'l1', createdAt: STAMP, updatedAt: STAMP, ownerType: 'topic', ownerId: 'k1', date: '2026-10-01', content: 'Li o capítulo 1' },
    ],
    questions: [
      { id: 'q1', createdAt: STAMP, updatedAt: STAMP, ownerType: 'topic', ownerId: 'k1', question: 'Por quê?', answer: '', status: 'open', answeredOn: null },
    ],
  };
}
