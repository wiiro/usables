import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Drawer } from '../../../components/ui/Drawer';
import { OccurrenceBanner } from '../../../components/ui/OccurrenceBanner';
import type { ISODate } from '../../../types/common';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { projectName, taskTitle } from '../../../domain/labels';
import { taskProgress } from '../../../domain/progress';
import { useWorkActions } from '../../../store/actions/useWorkActions';
import { useAppState } from '../../../store/StoreContext';
import type { Task } from '../../../types/work';
import { TaskSectionTabs } from './TaskSectionTabs';

interface TaskDrawerProps {
  task: Task;
  /** Data da ocorrência, quando aberta a partir do calendário ou da tela Hoje. */
  occurrence?: ISODate | null;
  onClose: () => void;
}

/** Painel de uma tarefa: título e progresso no topo, abas com os detalhes e as seções. */
export function TaskDrawer({ task, occurrence = null, onClose }: TaskDrawerProps) {
  const { projects } = useAppState();
  const { updateTask, deleteTask, setTaskOccurrenceDone } = useWorkActions();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const project = projects.find((p) => p.id === task.projectId);

  const eyebrow = project && (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-sm" style={{ backgroundColor: project.color }} aria-hidden />
      {projectName(project)}
    </span>
  );

  const footer = (
    <>
      <Button variant="ghost" onClick={() => setConfirmingDelete(true)} className="text-red-600 dark:text-red-400">
        <Trash2 className="size-4" aria-hidden />
        Excluir tarefa
      </Button>
      <span className="ml-auto text-xs text-fg-muted">Alterações salvas automaticamente</span>
    </>
  );

  return (
    <Drawer title="Tarefa" eyebrow={eyebrow} onClose={onClose} footer={footer}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <input
            value={task.title}
            onChange={(event) => updateTask(task.id, { title: event.target.value })}
            placeholder="Título da tarefa"
            aria-label="Título da tarefa"
            className="w-full rounded-lg bg-transparent px-1 py-1 text-xl font-semibold placeholder:text-fg-muted focus:bg-surface-muted/60 focus:outline-none"
          />
          <ProgressBar value={taskProgress(task)} label="Progresso da tarefa" color={project?.color} />
        </div>
        <OccurrenceBanner
          date={occurrence}
          recurrence={task.recurrence}
          startDate={task.dueDate}
          completedOccurrences={task.completedOccurrences}
          onToggle={(date, done) => setTaskOccurrenceDone(task.id, date, done)}
        />
        <TaskSectionTabs key={task.id} task={task} />
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title={`Excluir "${taskTitle(task)}"?`}
          confirmLabel="Excluir tarefa"
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            onClose();
            deleteTask(task.id);
          }}
        >
          A tarefa, as subtarefas e tudo o que estiver registrado nela (anotações, ideias, bloqueios e avanços) serão
          excluídos. Não dá para desfazer.
        </ConfirmDialog>
      )}
    </Drawer>
  );
}
