import { useMemo, useState } from 'react';
import { BlockersSection } from '../../../components/sections/BlockersSection';
import { IdeasSection } from '../../../components/sections/IdeasSection';
import { NotesSection } from '../../../components/sections/NotesSection';
import { ProgressLogSection } from '../../../components/sections/ProgressLogSection';
import { Tabs } from '../../../components/ui/Tabs';
import { TASK_STATUS_LABELS } from '../../../domain/labels';
import { countActiveBlockers, itemsOf } from '../../../domain/sections';
import { collectTags } from '../../../domain/tags';
import { useWorkActions } from '../../../store/actions/useWorkActions';
import { useAppState } from '../../../store/StoreContext';
import type { OwnerRef } from '../../../types/common';
import type { Task } from '../../../types/work';
import { SubtaskList } from './SubtaskList';
import { TaskDetailsFields } from './TaskDetailsFields';

type TaskTab = 'details' | 'notes' | 'ideas' | 'blockers' | 'logs';

/** Abas do painel da tarefa: Detalhes, Anotações, Ideias, Bloqueios e Avanços. */
export function TaskSectionTabs({ task }: { task: Task }) {
  const { projects, tasks, ideas, blockers, progressLogs } = useAppState();
  const { updateTask } = useWorkActions();
  const [tab, setTab] = useState<TaskTab>('details');
  const owner = useMemo<OwnerRef>(() => ({ ownerType: 'task', ownerId: task.id }), [task.id]);
  const tagSuggestions = useMemo(() => collectTags(tasks), [tasks]);
  const taskBlockers = itemsOf(blockers, owner);
  const activeBlockers = countActiveBlockers(taskBlockers);

  const items = [
    { id: 'details', label: 'Detalhes' },
    { id: 'notes', label: 'Anotações' },
    { id: 'ideas', label: 'Ideias', count: itemsOf(ideas, owner).length },
    { id: 'blockers', label: 'Bloqueios', count: activeBlockers, alert: true },
    { id: 'logs', label: 'Avanços', count: itemsOf(progressLogs, owner).length },
  ] as const;

  return (
    <Tabs label="Seções da tarefa" items={items} value={tab} onChange={setTab}>
      {tab === 'details' && (
        <div className="flex flex-col gap-6">
          <TaskDetailsFields task={task} projects={projects} tagSuggestions={tagSuggestions} />
          <SubtaskList task={task} />
        </div>
      )}
      {tab === 'notes' && <NotesSection value={task.notes} onChange={(notes) => updateTask(task.id, { notes })} />}
      {tab === 'ideas' && <IdeasSection owner={owner} />}
      {tab === 'blockers' && (
        <BlockersSection
          owner={owner}
          notice={<StatusNotice task={task} activeBlockers={activeBlockers} hasBlockers={taskBlockers.length > 0} />}
        />
      )}
      {tab === 'logs' && <ProgressLogSection owner={owner} />}
    </Tabs>
  );
}

interface StatusNoticeProps {
  task: Task;
  activeBlockers: number;
  hasBlockers: boolean;
}

/**
 * Status e bloqueios são independentes (decisão do projeto), mas quando eles
 * se contradizem, sugere o ajuste com um clique em vez de mudar sozinho.
 */
function StatusNotice({ task, activeBlockers, hasBlockers }: StatusNoticeProps) {
  const { updateTask } = useWorkActions();
  const suggestBlocked = activeBlockers > 0 && task.status !== 'blocked' && task.status !== 'done';
  const suggestDoing = hasBlockers && activeBlockers === 0 && task.status === 'blocked';
  if (!suggestBlocked && !suggestDoing) return null;

  const next = suggestBlocked ? 'blocked' : 'doing';
  const message = suggestBlocked
    ? `Há bloqueio ativo, mas o status da tarefa é "${TASK_STATUS_LABELS[task.status]}".`
    : 'Todos os bloqueios foram resolvidos, mas o status continua "Bloqueado".';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
      <span>{message}</span>
      <button type="button" onClick={() => updateTask(task.id, { status: next })} className="font-semibold underline">
        Mudar para "{TASK_STATUS_LABELS[next]}"
      </button>
    </div>
  );
}
