import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { BlockersSection } from '../../../components/sections/BlockersSection';
import { IdeasSection } from '../../../components/sections/IdeasSection';
import { NotesSection } from '../../../components/sections/NotesSection';
import { ProgressLogSection } from '../../../components/sections/ProgressLogSection';
import { RouteTabs } from '../../../components/ui/RouteTabs';
import { countActiveBlockers, itemsOf } from '../../../domain/sections';
import { useWorkActions } from '../../../store/actions/useWorkActions';
import { useAppState } from '../../../store/StoreContext';
import type { OwnerRef } from '../../../types/common';
import type { Project, Task } from '../../../types/work';
import type { ProjectSectionSlug } from '../projectSections';
import { PROJECT_SECTIONS, projectPath } from '../projectSections';
import { TaskViews } from '../views/TaskViews';

const useProjectOwner = (projectId: string): OwnerRef =>
  useMemo(() => ({ ownerType: 'project', ownerId: projectId }), [projectId]);

/** Abas do projeto, com contagens (bloqueios ativos em vermelho). */
export function ProjectSectionTabs({ project }: { project: Project }) {
  const { ideas, blockers, progressLogs } = useAppState();
  const owner = useProjectOwner(project.id);

  const counts: Partial<Record<ProjectSectionSlug, { count: number; alert?: boolean }>> = {
    ideias: { count: itemsOf(ideas, owner).length },
    bloqueios: { count: countActiveBlockers(itemsOf(blockers, owner)), alert: true },
    avancos: { count: itemsOf(progressLogs, owner).length },
  };

  const tabs = PROJECT_SECTIONS.map((section) => ({
    to: projectPath(project.id, section.slug),
    label: section.label,
    end: true,
    ...counts[section.slug],
  }));

  return <RouteTabs label="Seções do projeto" tabs={tabs} />;
}

interface ProjectSectionContentProps {
  section: ProjectSectionSlug;
  project: Project;
  tasks: Task[];
}

export function ProjectSectionContent({ section, project, tasks }: ProjectSectionContentProps) {
  const { updateProject } = useWorkActions();
  const owner = useProjectOwner(project.id);

  switch (section) {
    case '':
      return <TaskViews tasks={tasks} fixedProject={project} />;
    case 'anotacoes':
      return (
        <Narrow>
          <NotesSection key={project.id} value={project.notes} onChange={(notes) => updateProject(project.id, { notes })} />
        </Narrow>
      );
    case 'ideias':
      return <Narrow><IdeasSection owner={owner} /></Narrow>;
    case 'bloqueios':
      return <Narrow><BlockersSection owner={owner} /></Narrow>;
    case 'avancos':
      return <Narrow><ProgressLogSection owner={owner} /></Narrow>;
  }
}

function Narrow({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl">{children}</div>;
}
