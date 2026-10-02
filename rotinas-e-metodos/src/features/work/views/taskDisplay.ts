import { tasksWithActiveBlocker } from '../../../domain/kanban';
import { useToday } from '../../../hooks/useToday';
import { useAppState } from '../../../store/StoreContext';
import type { ID } from '../../../types/common';
import type { Project } from '../../../types/work';

/** O que os cartões do Kanban e as linhas da Lista precisam além da própria tarefa. */
export interface TaskDisplay {
  projectsById: ReadonlyMap<ID, Project>;
  /** Tarefas com bloqueio ativo (ícone de alerta). */
  blockedIds: ReadonlySet<ID>;
  today: Date;
  /** Na visão de todos os projetos, cada item mostra de qual projeto é. */
  showProject: boolean;
  onOpen: (taskId: ID) => void;
}

export function useTaskDisplay(showProject: boolean, onOpen: (taskId: ID) => void): TaskDisplay {
  const { projects, blockers } = useAppState();
  const today = useToday();
  return {
    projectsById: new Map(projects.map((project) => [project.id, project])),
    blockedIds: tasksWithActiveBlocker(blockers),
    today,
    showProject,
    onOpen,
  };
}
