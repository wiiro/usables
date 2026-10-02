import type { FormEvent } from 'react';
import { useId, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { ColorPicker } from '../../../components/ui/ColorPicker';
import { Drawer } from '../../../components/ui/Drawer';
import { Field, TextArea, TextInput } from '../../../components/ui/form';
import { DEFAULT_SUBJECT_COLOR } from '../../../domain/colors';
import type { SubjectFields as SubjectFieldsValue } from '../../../store/actions/study';
import { useStudyActions } from '../../../store/actions/useStudyActions';
import type { Subject } from '../../../types/study';

interface SubjectFieldsProps {
  value: SubjectFieldsValue;
  onChange: (patch: Partial<SubjectFieldsValue>) => void;
  autoFocusName?: boolean;
}

function SubjectFields({ value, onChange, autoFocusName }: SubjectFieldsProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-5">
      <Field label="Nome" htmlFor={`${id}-name`}>
        <TextInput
          id={`${id}-name`}
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ex.: Estatística"
          data-autofocus={autoFocusName || undefined}
        />
      </Field>
      <Field label="Descrição" htmlFor={`${id}-description`}>
        <TextArea id={`${id}-description`} rows={3} value={value.description} onChange={(e) => onChange({ description: e.target.value })} />
      </Field>
      <Field label="Cor" htmlFor={`${id}-color`}>
        <ColorPicker id={`${id}-color`} label="Cor da matéria" value={value.color} onChange={(color) => onChange({ color })} />
      </Field>
    </div>
  );
}

/** Criação: os campos ficam num rascunho até clicar em "Criar matéria". */
export function NewSubjectDrawer({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { createSubject } = useStudyActions();
  const [draft, setDraft] = useState<SubjectFieldsValue>({ name: '', description: '', color: DEFAULT_SUBJECT_COLOR });
  const formId = useId();
  const canSubmit = draft.name.trim() !== '';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (canSubmit) onCreated(createSubject(draft));
  };

  const footer = (
    <>
      <Button variant="primary" type="submit" form={formId} disabled={!canSubmit}>
        Criar matéria
      </Button>
      <Button onClick={onClose}>Cancelar</Button>
    </>
  );

  return (
    <Drawer title="Nova matéria" onClose={onClose} footer={footer}>
      <form id={formId} onSubmit={submit}>
        <SubjectFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} autoFocusName />
      </form>
    </Drawer>
  );
}

/** Edição: cada alteração é salva na hora. */
export function EditSubjectDrawer({ subject, onClose }: { subject: Subject; onClose: () => void }) {
  const { updateSubject } = useStudyActions();
  return (
    <Drawer title="Editar matéria" eyebrow="Alterações salvas automaticamente" onClose={onClose} footer={<Button onClick={onClose}>Fechar</Button>}>
      <SubjectFields value={subject} onChange={(patch) => updateSubject(subject.id, patch)} />
    </Drawer>
  );
}
