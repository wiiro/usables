import type { FormEvent } from 'react';
import { useId, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { DEFAULT_PROJECT_COLOR } from '../../../domain/colors';
import type { ProjectFields as ProjectFieldsValue } from '../../../store/actions/projects';
import { useWorkActions } from '../../../store/actions/useWorkActions';
import type { Project } from '../../../types/work';
import { ProjectFields } from './ProjectFields';

const EMPTY_PROJECT: ProjectFieldsValue = {
  name: '',
  description: '',
  color: DEFAULT_PROJECT_COLOR,
  startDate: null,
  dueDate: null,
};

/** Criação: os campos ficam num rascunho até clicar em "Criar projeto". */
export function NewProjectDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { createProject } = useWorkActions();
  const [draft, setDraft] = useState(EMPTY_PROJECT);
  const formId = useId();
  const canSubmit = draft.name.trim() !== '';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    onCreated(createProject(draft));
  };

  return (
    <Drawer
      title="Novo projeto"
      onClose={onClose}
      footer={
        <>
          <Button variant="primary" type="submit" form={formId} disabled={!canSubmit}>
            Criar projeto
          </Button>
          <Button onClick={onClose}>Cancelar</Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit}>
        <ProjectFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} autoFocusName />
      </form>
    </Drawer>
  );
}

/** Edição: cada alteração é salva na hora. */
export function EditProjectDrawer({ project, onClose }: { project: Project; onClose: () => void }) {
  const { updateProject } = useWorkActions();

  return (
    <Drawer
      title="Editar projeto"
      eyebrow="Alterações salvas automaticamente"
      onClose={onClose}
      footer={<Button onClick={onClose}>Fechar</Button>}
    >
      <ProjectFields value={project} onChange={(patch) => updateProject(project.id, patch)} />
    </Drawer>
  );
}
