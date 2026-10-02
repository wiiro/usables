import { formatShortDate, toISODate } from '../../../domain/dates';
import type { Project } from '../../../types/work';

interface ProjectDatesProps {
  project: Pick<Project, 'startDate' | 'dueDate'>;
  progress: number | null;
  today: Date;
}

/** "1 out → 15 dez"; o prazo fica vermelho se passou e o projeto não está completo. */
export function ProjectDates({ project, progress, today }: ProjectDatesProps) {
  const { startDate, dueDate } = project;
  if (!startDate && !dueDate) return null;

  const late = dueDate !== null && dueDate < toISODate(today) && progress !== 1;
  const due = dueDate && (
    <span className={late ? 'font-medium text-red-600 dark:text-red-400' : undefined}>
      {formatShortDate(dueDate, today)}
      {late && ' (prazo vencido)'}
    </span>
  );

  if (startDate && dueDate) {
    return (
      <span>
        {formatShortDate(startDate, today)} → {due}
      </span>
    );
  }
  return startDate ? <span>desde {formatShortDate(startDate, today)}</span> : <span>até {due}</span>;
}
