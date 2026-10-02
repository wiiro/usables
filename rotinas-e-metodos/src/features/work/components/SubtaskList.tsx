import { Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useWorkActions } from '../../../store/actions/useWorkActions';
import type { Task } from '../../../types/work';

/** Subtarefas com checkbox. Um título apagado (campo vazio ao sair) remove a subtarefa. */
export function SubtaskList({ task }: { task: Task }) {
  const { addSubtask, updateSubtask, removeSubtask } = useWorkActions();
  const [draft, setDraft] = useState('');
  const done = task.subtasks.filter((subtask) => subtask.done).length;

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    addSubtask(task.id, draft);
    setDraft('');
  };

  return (
    <section aria-labelledby="subtasks-heading" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 id="subtasks-heading" className="text-xs font-medium text-fg-muted">
          Subtarefas
        </h3>
        {task.subtasks.length > 0 && (
          <span className="text-xs tabular-nums text-fg-muted">
            {done} de {task.subtasks.length}
          </span>
        )}
      </div>

      {task.subtasks.length > 0 && (
        <ul className="flex flex-col">
          {task.subtasks.map((subtask) => (
            <li key={subtask.id} className="group flex items-center gap-2 rounded-lg px-1 hover:bg-surface-muted/60">
              <input
                type="checkbox"
                checked={subtask.done}
                onChange={(event) => updateSubtask(task.id, subtask.id, { done: event.target.checked })}
                aria-label={`Concluir "${subtask.title}"`}
                className="size-4 shrink-0 cursor-pointer accent-accent"
              />
              <input
                value={subtask.title}
                onChange={(event) => updateSubtask(task.id, subtask.id, { title: event.target.value })}
                onBlur={() => {
                  if (!subtask.title.trim()) removeSubtask(task.id, subtask.id);
                }}
                aria-label="Título da subtarefa"
                className={`min-w-0 flex-1 bg-transparent py-1.5 text-sm focus:outline-none ${subtask.done ? 'text-fg-muted line-through' : ''}`}
              />
              <button
                type="button"
                onClick={() => removeSubtask(task.id, subtask.id)}
                aria-label={`Remover "${subtask.title}"`}
                className="rounded p-1 text-fg-muted opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:text-red-600 focus:opacity-100"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex items-center gap-2 rounded-lg border border-dashed border-line px-2">
        <Plus className="size-4 shrink-0 text-fg-muted" aria-hidden />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Adicionar subtarefa (Enter)"
          aria-label="Nova subtarefa"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm placeholder:text-fg-muted focus:outline-none"
        />
      </form>
    </section>
  );
}
