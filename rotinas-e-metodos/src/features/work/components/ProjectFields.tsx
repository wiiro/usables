import { useId } from 'react';
import { ColorPicker } from '../../../components/ui/ColorPicker';
import { DateInput, Field, TextArea, TextInput } from '../../../components/ui/form';
import type { ProjectFields as ProjectFieldsValue } from '../../../store/actions/projects';

interface ProjectFieldsProps {
  value: ProjectFieldsValue;
  onChange: (patch: Partial<ProjectFieldsValue>) => void;
  /** Foca o nome ao abrir (no formulário de criação). */
  autoFocusName?: boolean;
}

/** Campos do projeto, usados tanto para criar quanto para editar. */
export function ProjectFields({ value, onChange, autoFocusName }: ProjectFieldsProps) {
  const id = useId();
  const dueBeforeStart = value.startDate && value.dueDate && value.dueDate < value.startDate;

  return (
    <div className="flex flex-col gap-5">
      <Field label="Nome" htmlFor={`${id}-name`}>
        <TextInput
          id={`${id}-name`}
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ex.: Migração do sistema de cobrança"
          data-autofocus={autoFocusName || undefined}
          required
        />
      </Field>

      <Field label="Descrição" htmlFor={`${id}-description`}>
        <TextArea
          id={`${id}-description`}
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
        />
      </Field>

      <Field label="Cor" htmlFor={`${id}-color`}>
        <ColorPicker id={`${id}-color`} label="Cor do projeto" value={value.color} onChange={(color) => onChange({ color })} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Início" htmlFor={`${id}-start`}>
          <DateInput id={`${id}-start`} value={value.startDate} onChange={(startDate) => onChange({ startDate })} />
        </Field>
        <Field
          label="Prazo"
          htmlFor={`${id}-due`}
          warning={dueBeforeStart ? 'O prazo está antes do início.' : undefined}
        >
          <DateInput id={`${id}-due`} value={value.dueDate} onChange={(dueDate) => onChange({ dueDate })} />
        </Field>
      </div>
    </div>
  );
}
