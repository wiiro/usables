import { useId, useMemo } from 'react';
import { DateInput, Field, Select, TextArea } from '../../../components/ui/form';
import { RecurrenceField } from '../../../components/ui/RecurrenceField';
import { TagInput } from '../../../components/ui/TagInput';
import { isOverdue } from '../../../domain/dates';
import { PRIORITY_LABELS, TASK_STATUS_LABELS, projectName } from '../../../domain/labels';
import { useToday } from '../../../hooks/useToday';
import { useWorkActions } from '../../../store/actions/useWorkActions';
import type { Project, Task } from '../../../types/work';
import { PRIORITIES, TASK_STATUSES } from '../../../types/work';

interface TaskDetailsFieldsProps {
  task: Task;
  projects: Project[];
  tagSuggestions: string[];
}

/** Campos da tarefa no painel lateral. Cada alteração é salva na hora. */
export function TaskDetailsFields({ task, projects, tagSuggestions }: TaskDetailsFieldsProps) {
  const actions = useWorkActions();
  const today = useToday();
  const id = useId();
  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => projectName(a).localeCompare(projectName(b), 'pt-BR')),
    [projects],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor={`${id}-status`}>
          <Select
            id={`${id}-status`}
            value={task.status}
            onChange={(e) => {
              const status = TASK_STATUSES.find((s) => s === e.target.value);
              if (status) actions.updateTask(task.id, { status });
            }}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Prioridade" htmlFor={`${id}-priority`}>
          <Select
            id={`${id}-priority`}
            value={task.priority}
            onChange={(e) => {
              const priority = PRIORITIES.find((p) => p === e.target.value);
              if (priority) actions.updateTask(task.id, { priority });
            }}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Data de entrega"
          htmlFor={`${id}-due`}
          warning={isOverdue(task, today) ? 'Atrasada.' : undefined}
          hint={task.recurrence ? 'Início da repetição.' : undefined}
        >
          <DateInput id={`${id}-due`} value={task.dueDate} onChange={(date) => actions.setTaskDueDate(task.id, date)} />
        </Field>

        <Field label="Projeto" htmlFor={`${id}-project`}>
          <Select
            id={`${id}-project`}
            value={task.projectId}
            onChange={(e) => actions.updateTask(task.id, { projectId: e.target.value })}
          >
            {sortedProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {projectName(project)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <RecurrenceField
        value={task.recurrence}
        startDate={task.dueDate}
        dateLabel="data de entrega"
        onChange={(recurrence) => actions.setTaskRecurrence(task.id, recurrence)}
      />

      <Field label="Etiquetas" htmlFor={`${id}-tags`} hint="Enter ou vírgula para adicionar.">
        <TagInput
          id={`${id}-tags`}
          tags={task.tags}
          suggestions={tagSuggestions}
          onChange={(tags) => actions.updateTask(task.id, { tags })}
        />
      </Field>

      <Field label="Descrição" htmlFor={`${id}-description`}>
        <TextArea
          id={`${id}-description`}
          value={task.description}
          onChange={(e) => actions.updateTask(task.id, { description: e.target.value })}
        />
      </Field>
    </div>
  );
}
