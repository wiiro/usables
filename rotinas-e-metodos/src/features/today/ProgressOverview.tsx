import { Link } from 'react-router';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { projectName, subjectName, taskCountLabel, topicCountLabel } from '../../domain/labels';
import { projectProgress, subjectProgress } from '../../domain/progress';
import { useAppState } from '../../store/StoreContext';
import { CardEmpty } from './TodayCard';

/** Progresso de cada projeto (e de cada matéria), com link para a página dele. */
export function ProgressOverview() {
  const { projects, tasks, subjects, topics } = useAppState();

  if (projects.length === 0 && subjects.length === 0) {
    return <CardEmpty>Crie projetos e matérias para acompanhar o progresso aqui.</CardEmpty>;
  }

  const rows = [
    ...[...projects]
      .sort((a, b) => projectName(a).localeCompare(projectName(b), 'pt-BR'))
      .map((project) => {
        const own = tasks.filter((task) => task.projectId === project.id);
        return { key: project.id, to: `/trabalho/projetos/${project.id}`, name: projectName(project), color: project.color, value: projectProgress(own), label: taskCountLabel(own), group: 'Projetos' };
      }),
    ...[...subjects]
      .sort((a, b) => subjectName(a).localeCompare(subjectName(b), 'pt-BR'))
      .map((subject) => {
        const own = topics.filter((topic) => topic.subjectId === subject.id);
        return { key: subject.id, to: `/estudos/materias/${subject.id}`, name: subjectName(subject), color: subject.color, value: subjectProgress(own), label: topicCountLabel(own), group: 'Matérias' };
      }),
  ];

  return (
    <ul className="flex flex-col">
      {rows.map((row, index) => (
        <li key={row.key}>
          {(index === 0 || rows[index - 1].group !== row.group) && (
            <h3 className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-fg-muted uppercase">{row.group}</h3>
          )}
          <Link to={row.to} className="flex flex-col gap-1 rounded-lg px-3 py-2 hover:bg-surface-muted/60">
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium">{row.name}</span>
              <span className="shrink-0 text-xs text-fg-muted">{row.label}</span>
            </span>
            <ProgressBar value={row.value} label={`Progresso de ${row.name}`} color={row.color} size="sm" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
