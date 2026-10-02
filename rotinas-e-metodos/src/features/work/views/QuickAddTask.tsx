import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Select, TextInput } from '../../../components/ui/form';
import { projectName } from '../../../domain/labels';
import { useWorkActions } from '../../../store/actions/useWorkActions';
import type { ID } from '../../../types/common';
import type { Project } from '../../../types/work';

interface QuickAddTaskProps {
  /** Na página do projeto, a tarefa vai direto para ele. */
  fixedProjectId: ID | null;
  /** Já em ordem alfabética. */
  projects: Project[];
  /** Projeto pré-selecionado na visão geral (ex.: o do filtro). */
  suggestedProjectId: ID | null;
}

/** Título + Enter cria a tarefa em "A fazer". Os detalhes ficam no painel. */
export function QuickAddTask({ fixedProjectId, projects, suggestedProjectId }: QuickAddTaskProps) {
  const { createTask } = useWorkActions();
  const [title, setTitle] = useState('');
  const [chosenProjectId, setChosenProjectId] = useState<ID | null>(null);

  // Escolha feita aqui > projeto do filtro > primeiro projeto. Se o escolhido
  // for excluído, cai no próximo da lista.
  const valid = (id: ID | null) => (id && projects.some((p) => p.id === id) ? id : null);
  const projectId = fixedProjectId ?? valid(chosenProjectId) ?? valid(suggestedProjectId) ?? projects[0]?.id ?? null;

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !projectId) return;
    createTask(projectId, title);
    setTitle('');
  };

  return (
    <form onSubmit={add} className="flex flex-wrap gap-2">
      <TextInput
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Nova tarefa: digite o título e tecle Enter"
        aria-label="Título da nova tarefa"
        className="min-w-60 flex-1"
      />
      {!fixedProjectId && (
        <Select
          value={projectId ?? ''}
          onChange={(event) => setChosenProjectId(event.target.value)}
          aria-label="Projeto da nova tarefa"
          className="w-auto max-w-60"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {projectName(project)}
            </option>
          ))}
        </Select>
      )}
      <Button type="submit" variant="primary" disabled={!title.trim() || !projectId} className="h-auto">
        <Plus className="size-4" aria-hidden />
        Adicionar
      </Button>
    </form>
  );
}
