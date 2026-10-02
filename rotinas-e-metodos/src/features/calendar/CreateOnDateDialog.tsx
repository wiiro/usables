import type { FormEvent } from 'react';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/Button';
import { Field, Select, TextInput } from '../../components/ui/form';
import { Segmented } from '../../components/ui/Segmented';
import { useModalDialog } from '../../components/ui/useModalDialog';
import { formatLongDate } from '../../domain/dates';
import { projectName, subjectName } from '../../domain/labels';
import { useItemDrawer } from '../../hooks/useItemDrawer';
import { useStudyActions } from '../../store/actions/useStudyActions';
import { useWorkActions } from '../../store/actions/useWorkActions';
import { useAppState } from '../../store/StoreContext';
import type { ID, ISODate } from '../../types/common';
import type { CalendarArea } from '../../types/state';

type Kind = 'task' | 'topic';
const KIND_OPTIONS = [
  { value: 'task', label: 'Tarefa' },
  { value: 'topic', label: 'Tópico de estudo' },
] as const;

interface CreateOnDateDialogProps {
  date: ISODate;
  area: CalendarArea;
  onClose: () => void;
}

/** Clique num dia do calendário: cria uma tarefa ou um tópico com aquela data e abre o painel dele. */
export function CreateOnDateDialog({ date, area, onClose }: CreateOnDateDialogProps) {
  const dialogProps = useModalDialog(onClose);
  const titleId = useId();
  const [kind, setKind] = useState<Kind>(area === 'study' ? 'topic' : 'task');

  return (
    <dialog {...dialogProps} aria-labelledby={titleId} className="m-auto w-full max-w-md rounded-xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40">
      <div className="flex flex-col gap-4 px-6 py-5">
        <div>
          <h2 id={titleId} className="text-base font-semibold">
            Novo item em {formatLongDate(date)}
          </h2>
          {area === 'all' && (
            <div className="mt-3">
              <Segmented label="Tipo de item" options={KIND_OPTIONS} value={kind} onChange={setKind} />
            </div>
          )}
        </div>
        <CreateForm key={kind} kind={kind} date={date} onDone={onClose} />
      </div>
    </dialog>
  );
}

function CreateForm({ kind, date, onDone }: { kind: Kind; date: ISODate; onDone: () => void }) {
  const { projects, subjects } = useAppState();
  const { createTask } = useWorkActions();
  const { createTopic } = useStudyActions();
  const taskDrawer = useItemDrawer('tarefa');
  const topicDrawer = useItemDrawer('topico');
  const id = useId();
  const parents = useMemo(() => {
    const list = kind === 'task' ? projects.map((p) => ({ id: p.id, name: projectName(p) })) : subjects.map((s) => ({ id: s.id, name: subjectName(s) }));
    return list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [kind, projects, subjects]);
  const [title, setTitle] = useState('');
  const [parentId, setParentId] = useState<ID>(parents[0]?.id ?? '');

  if (parents.length === 0) {
    const to = kind === 'task' ? '/trabalho' : '/estudos';
    return (
      <p className="text-sm text-fg-muted">
        {kind === 'task' ? 'Toda tarefa pertence a um projeto.' : 'Todo tópico pertence a uma matéria.'}{' '}
        <Link to={to} onClick={onDone} className="font-medium text-accent underline">
          {kind === 'task' ? 'Criar um projeto' : 'Criar uma matéria'}
        </Link>
      </p>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !parentId) return;
    onDone();
    if (kind === 'task') taskDrawer.open(createTask(parentId, title, date));
    else topicDrawer.open(createTopic(parentId, title, date));
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Título" htmlFor={`${id}-title`}>
        <TextInput id={`${id}-title`} value={title} onChange={(e) => setTitle(e.target.value)} data-autofocus autoFocus />
      </Field>
      <Field label={kind === 'task' ? 'Projeto' : 'Matéria'} htmlFor={`${id}-parent`}>
        <Select id={`${id}-parent`} value={parentId} onChange={(e) => setParentId(e.target.value)}>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={!title.trim()}>
          Criar e abrir
        </Button>
      </div>
    </form>
  );
}
