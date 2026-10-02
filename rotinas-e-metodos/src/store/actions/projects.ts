import type { ID, ISODateTime } from '../../types/common';
import type { AppState } from '../../types/state';
import type { Project } from '../../types/work';
import type { CreateMeta } from './common';
import { findById, removeSectionsOf } from './common';

/** Campos que o formulário de projeto edita. */
export type ProjectFields = Pick<Project, 'name' | 'description' | 'color' | 'startDate' | 'dueDate'>;

export type ProjectPatch = Partial<ProjectFields & Pick<Project, 'notes'>>;

export function createProject(draft: AppState, fields: ProjectFields, { id, now }: CreateMeta): void {
  draft.projects.push({
    id,
    createdAt: now,
    updatedAt: now,
    ...fields,
    name: fields.name.trim(),
    notes: '',
  });
}

export function updateProject(draft: AppState, id: ID, patch: ProjectPatch, now: ISODateTime): void {
  Object.assign(findById(draft.projects, id, 'Projeto'), patch, { updatedAt: now });
}

/** Exclui o projeto, as tarefas dele e todas as seções do projeto e dessas tarefas. */
export function deleteProject(draft: AppState, id: ID): void {
  findById(draft.projects, id, 'Projeto');
  const taskIds = new Set(draft.tasks.filter((task) => task.projectId === id).map((task) => task.id));

  draft.projects = draft.projects.filter((project) => project.id !== id);
  draft.tasks = draft.tasks.filter((task) => task.projectId !== id);
  removeSectionsOf(draft, 'project', new Set([id]));
  removeSectionsOf(draft, 'task', taskIds);
}
