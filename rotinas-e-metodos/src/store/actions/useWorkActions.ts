import { useMemo } from 'react';
import type { ID, ISODate, Recurrence } from '../../types/common';
import type { TaskView } from '../../types/state';
import type { Subtask } from '../../types/work';
import { useStore } from '../StoreContext';
import { setTaskView } from './preferences';
import type { ProjectFields, ProjectPatch } from './projects';
import { createProject, deleteProject, updateProject } from './projects';
import type { MoveTarget, TaskPatch } from './tasks';
import * as tasks from './tasks';

const now = () => new Date().toISOString();
const meta = () => ({ id: crypto.randomUUID(), now: now() });

/** Ações da área de Trabalho, já ligadas ao store: cada chamada altera, grava e redesenha. */
export function useWorkActions() {
  const store = useStore();

  return useMemo(
    () => ({
      createProject(fields: ProjectFields): ID {
        const m = meta();
        store.update((d) => createProject(d, fields, m));
        return m.id;
      },
      updateProject: (id: ID, patch: ProjectPatch) => store.update((d) => updateProject(d, id, patch, now())),
      deleteProject: (id: ID) => store.update((d) => deleteProject(d, id)),

      createTask(projectId: ID, title: string, dueDate: ISODate | null = null): ID {
        const m = meta();
        store.update((d) => tasks.createTask(d, { projectId, title, dueDate }, m));
        return m.id;
      },
      setTaskOccurrenceDone: (id: ID, date: ISODate, done: boolean) =>
        store.update((d) => tasks.setTaskOccurrenceDone(d, id, date, done, now())),
      updateTask: (id: ID, patch: TaskPatch) => store.update((d) => tasks.updateTask(d, id, patch, now())),
      setTaskDueDate: (id: ID, dueDate: ISODate | null) =>
        store.update((d) => tasks.setTaskDueDate(d, id, dueDate, now())),
      setTaskRecurrence: (id: ID, recurrence: Recurrence | null) =>
        store.update((d) => tasks.setTaskRecurrence(d, id, recurrence, now())),
      deleteTask: (id: ID) => store.update((d) => tasks.deleteTask(d, id)),
      moveTask: (id: ID, target: MoveTarget) => store.update((d) => tasks.moveTask(d, id, target, now())),
      setTaskView: (view: TaskView) => store.update((d) => setTaskView(d, view)),

      addSubtask: (taskId: ID, title: string) => store.update((d) => tasks.addSubtask(d, taskId, title, meta())),
      updateSubtask: (taskId: ID, subtaskId: ID, patch: Partial<Pick<Subtask, 'title' | 'done'>>) =>
        store.update((d) => tasks.updateSubtask(d, taskId, subtaskId, patch, now())),
      removeSubtask: (taskId: ID, subtaskId: ID) =>
        store.update((d) => tasks.removeSubtask(d, taskId, subtaskId, now())),
    }),
    [store],
  );
}
