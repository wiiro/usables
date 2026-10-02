import { Link } from 'react-router';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { projectName, taskCountLabel } from '../../../domain/labels';
import { projectProgress } from '../../../domain/progress';
import type { Project, Task } from '../../../types/work';
import { ProjectDates } from './projectSummary';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  today: Date;
}

export function ProjectCard({ project, tasks, today }: ProjectCardProps) {
  const name = projectName(project);
  const progress = projectProgress(tasks);

  return (
    <Link
      to={`/trabalho/projetos/${project.id}`}
      className="flex flex-col rounded-xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      style={{ borderTop: `4px solid ${project.color}` }}
    >
      <h2 className="truncate font-semibold">{name}</h2>
      {project.description && <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{project.description}</p>}
      <div className="mt-auto pt-4">
        <ProgressBar value={progress} label={`Progresso de ${name}`} color={project.color} size="sm" />
        <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-fg-muted">
          <span>{taskCountLabel(tasks)}</span>
          <ProjectDates project={project} progress={progress} today={today} />
        </div>
      </div>
    </Link>
  );
}
