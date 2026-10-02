import { Plus } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { countActiveBlockers, itemsOf, sortBlockers } from '../../domain/sections';
import { useSectionActions } from '../../store/actions/useSectionActions';
import { useAppState } from '../../store/StoreContext';
import type { OwnerRef } from '../../types/common';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/form';
import { BlockerItem } from './BlockerItem';
import { cancelOnEscape } from './cancelOnEscape';
import { EmptyHint, SectionHeader } from './SectionParts';

interface BlockersSectionProps {
  owner: OwnerRef;
  /** Conteúdo extra acima da lista (ex.: sugestão de mudar o status da tarefa). */
  notice?: ReactNode;
}

/** "Bloqueios": o que está impedindo o avanço, com status ativo/resolvido. */
export function BlockersSection({ owner, notice }: BlockersSectionProps) {
  const { blockers } = useAppState();
  const { addBlocker } = useSectionActions();
  const [adding, setAdding] = useState(false);
  const list = useMemo(() => sortBlockers(itemsOf(blockers, owner)), [blockers, owner]);
  const active = countActiveBlockers(list);
  const resolved = list.length - active;

  const summary = list.length === 0 ? 'O que está impedindo o avanço.' : `${plural(active, 'ativo', 'ativos')} · ${plural(resolved, 'resolvido', 'resolvidos')}`;
  const addButton = !adding && (
    <Button size="sm" onClick={() => setAdding(true)}>
      <Plus className="size-4" aria-hidden />
      Novo bloqueio
    </Button>
  );

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Bloqueios" summary={summary} action={addButton} />
      {notice}
      {adding && (
        <BlockerForm
          onSubmit={(description) => {
            addBlocker(owner, description);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {list.length === 0 && !adding && <EmptyHint>Nenhum bloqueio registrado.</EmptyHint>}
      <ul className="flex flex-col gap-2">
        {list.map((blocker) => (
          <BlockerItem key={blocker.id} blocker={blocker} />
        ))}
      </ul>
    </section>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function BlockerForm({ onSubmit, onCancel }: { onSubmit: (description: string) => void; onCancel: () => void }) {
  const [description, setDescription] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (description.trim()) onSubmit(description);
  };

  return (
    <form onSubmit={submit} onKeyDown={cancelOnEscape(onCancel)} className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface p-4">
      <TextArea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        autoFocus
        aria-label="Descrição do bloqueio"
        placeholder="O que está bloqueando? Ex.: aguardando acesso ao banco de homologação."
      />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={!description.trim()}>
          Registrar bloqueio
        </Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
