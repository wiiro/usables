import { Pencil, SearchX, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { projectName, taskCountLabel } from '../../domain/labels';
import { projectProgress } from '../../domain/progress';
import { useToday } from '../../hooks/useToday';
import { useWorkActions } from '../../store/actions/useWorkActions';
import { useAppState } from '../../store/StoreContext';
import type { Project, Task } from '../../types/work';
import { EditProjectDrawer } from './components/ProjectDrawers';
import { ProjectSectionContent, ProjectSectionTabs } from './components/ProjectSections';
import { ProjectDates } from './components/projectSummary';
import { parseProjectSection, projectPath } from './projectSections';

/** /trabalho/projetos/:projectId/:section? */
export function ProjectDetailPage() {
  const { projectId = '', section: sectionSlug } = useParams();
  const { projects, tasks } = useAppState();
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);

  const project = projects.find((p) => p.id === projectId);
  const projectTasks = useMemo(() => tasks.filter((task) => task.projectId === projectId), [tasks, projectId]);
  const section = parseProjectSection(sectionSlug);

  if (section === null) return <Navigate to={projectPath(projectId)} replace />;
  if (!project) {
    return (
      <EmptyState icon={SearchX} title="Projeto não encontrado">
        Ele pode ter sido excluído.{' '}
        <Link to="/trabalho" className="font-medium text-accent underline">
          Voltar para os projetos
        </Link>
      </EmptyState>
    );
  }

  return (
    <>
      <ProjectHeader project={project} tasks={projectTasks} onEdit={() => setDialog('edit')} onDelete={() => setDialog('delete')} />
      <div className="p-6 md:p-8">
        <ProjectSectionContent section={section} project={project} tasks={projectTasks} />
      </div>
      {dialog === 'edit' && <EditProjectDrawer project={project} onClose={() => setDialog(null)} />}
      {dialog === 'delete' && <DeleteProjectDialog project={project} taskCount={projectTasks.length} onCancel={() => setDialog(null)} />}
    </>
  );
}

interface ProjectHeaderProps {
  project: Project;
  tasks: Task[];
  onEdit: () => void;
  onDelete: () => void;
}

function ProjectHeader({ project, tasks, onEdit, onDelete }: ProjectHeaderProps) {
  const today = useToday();
  const name = projectName(project);
  const progress = projectProgress(tasks);

  const actions = (
    <>
      <Button onClick={onEdit}>
        <Pencil className="size-4" aria-hidden />
        Editar
      </Button>
      <Button variant="ghost" onClick={onDelete} aria-label="Excluir projeto" title="Excluir projeto">
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </>
  );

  return (
    <PageHeader
      title={name}
      color={project.color}
      back={{ to: '/trabalho', label: 'Projetos' }}
      description={project.description || undefined}
      actions={actions}
    >
      <div className="mt-4 flex max-w-2xl flex-col gap-1.5">
        <ProgressBar value={progress} label={`Progresso de ${name}`} color={project.color} />
        <div className="flex flex-wrap justify-between gap-x-4 text-xs text-fg-muted">
          <span>{taskCountLabel(tasks)}</span>
          <ProjectDates project={project} progress={progress} today={today} />
        </div>
      </div>
      <ProjectSectionTabs project={project} />
    </PageHeader>
  );
}

function DeleteProjectDialog({ project, taskCount, onCancel }: { project: Project; taskCount: number; onCancel: () => void }) {
  const { deleteProject } = useWorkActions();
  const navigate = useNavigate();

  return (
    <ConfirmDialog
      title={`Excluir o projeto "${projectName(project)}"?`}
      confirmLabel="Excluir projeto"
      onCancel={onCancel}
      onConfirm={() => {
        deleteProject(project.id);
        navigate('/trabalho', { replace: true });
      }}
    >
      {taskCount > 0 &&
        `${taskCount === 1 ? 'A tarefa dele também será excluída' : `As ${taskCount} tarefas dele também serão excluídas`}, ` +
          'com subtarefas e tudo o que estiver registrado nelas. '}
      Não dá para desfazer.
    </ConfirmDialog>
  );
}
