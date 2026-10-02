import { useNavigate } from 'react-router';
import { dateOfTimestamp, daysBetween, formatShortDate, toISODate } from '../../domain/dates';
import { projectName, taskTitle, topicTitle } from '../../domain/labels';
import { useItemDrawer } from '../../hooks/useItemDrawer';
import { useAppState } from '../../store/StoreContext';
import type { Blocker } from '../../types/sections';
import { CardEmpty } from './TodayCard';

/** Bloqueios ativos de todos os projetos e tarefas, do mais antigo ao mais novo. */
export function ActiveBlockers({ today }: { today: Date }) {
  const { blockers, projects, tasks, topics } = useAppState();
  const navigate = useNavigate();
  const taskDrawer = useItemDrawer('tarefa');
  const topicDrawer = useItemDrawer('topico');
  const active = blockers.filter((b) => b.status === 'active').sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (active.length === 0) return <CardEmpty>Nenhum bloqueio ativo.</CardEmpty>;

  const describeOwner = (blocker: Blocker): string => {
    if (blocker.ownerType === 'project') {
      const project = projects.find((p) => p.id === blocker.ownerId);
      return project ? `Projeto ${projectName(project)}` : '';
    }
    if (blocker.ownerType === 'task') {
      const task = tasks.find((t) => t.id === blocker.ownerId);
      const project = task && projects.find((p) => p.id === task.projectId);
      return task ? `${taskTitle(task)}${project ? ` · ${projectName(project)}` : ''}` : '';
    }
    const topic = topics.find((t) => t.id === blocker.ownerId);
    return topic ? topicTitle(topic) : '';
  };

  const open = (blocker: Blocker) => {
    if (blocker.ownerType === 'project') navigate(`/trabalho/projetos/${blocker.ownerId}/bloqueios`);
    else if (blocker.ownerType === 'task') taskDrawer.open(blocker.ownerId);
    else topicDrawer.open(blocker.ownerId);
  };

  return (
    <ul className="flex flex-col">
      {active.map((blocker) => {
        const since = dateOfTimestamp(blocker.createdAt);
        const age = daysBetween(since, toISODate(today));
        return (
          <li key={blocker.id}>
            <button type="button" onClick={() => open(blocker)} className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left hover:bg-surface-muted/60">
              <span className="line-clamp-2 text-sm">{blocker.description}</span>
              <span className="text-xs text-fg-muted">
                {describeOwner(blocker)} · desde {formatShortDate(since, today)}
                {age > 0 && ` (${age === 1 ? '1 dia' : `${age} dias`})`}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
