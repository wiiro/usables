import { Briefcase, GraduationCap, Repeat } from 'lucide-react';
import type { AgendaItem } from '../../domain/today';
import { lateLabel } from '../../domain/today';
import { formatShortDate } from '../../domain/dates';
import { useItemDrawer } from '../../hooks/useItemDrawer';
import { useStudyActions } from '../../store/actions/useStudyActions';
import { useWorkActions } from '../../store/actions/useWorkActions';

interface AgendaListProps {
  items: AgendaItem[];
  today: Date;
  /** Mostra há quanto tempo está atrasado. */
  late?: boolean;
}

/** Itens da tela Hoje: marcar como feito direto aqui, ou clicar para abrir o painel. */
export function AgendaList({ items, today, late }: AgendaListProps) {
  const toggle = useToggleDone();
  const taskDrawer = useItemDrawer('tarefa');
  const topicDrawer = useItemDrawer('topico');

  const open = (item: AgendaItem) => {
    const occurrence = item.recurring ? item.date : null;
    if (item.kind === 'task') taskDrawer.open(item.id, occurrence);
    else topicDrawer.open(item.id, occurrence);
  };

  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const AreaIcon = item.kind === 'task' ? Briefcase : GraduationCap;
        return (
          <li key={`${item.kind}:${item.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-muted/60">
            <input
              type="checkbox"
              checked={item.done}
              onChange={(event) => toggle(item, event.target.checked)}
              aria-label={`Marcar "${item.title}" como feito`}
              className="size-4 shrink-0 cursor-pointer accent-accent"
            />
            <button type="button" onClick={() => open(item)} className="flex min-w-0 flex-1 flex-col items-start text-left">
              <span className={`max-w-full truncate text-sm font-medium ${item.done ? 'text-fg-muted line-through' : ''}`}>{item.title}</span>
              <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                <AreaIcon className="size-3.5" aria-label={item.kind === 'task' ? 'Trabalho' : 'Estudos'} />
                <span className="size-2 rounded-sm" style={{ backgroundColor: item.parentColor }} aria-hidden />
                <span className="truncate">{item.parentName}</span>
                {item.recurring && <Repeat className="size-3.5" aria-label="Repete" />}
              </span>
            </button>
            {late && (
              <span className="shrink-0 text-right text-xs font-medium text-red-600 dark:text-red-400">
                {formatShortDate(item.date, today)}
                <span className="block font-normal">{lateLabel(item.date, today)}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Feito/desfeito: no item inteiro, ou só na ocorrência de hoje quando é recorrente. */
function useToggleDone() {
  const work = useWorkActions();
  const study = useStudyActions();
  return (item: AgendaItem, done: boolean) => {
    if (item.kind === 'task') {
      if (item.recurring) work.setTaskOccurrenceDone(item.id, item.date, done);
      else work.updateTask(item.id, { status: done ? 'done' : 'todo' });
    } else if (item.recurring) {
      study.setTopicOccurrenceDone(item.id, item.date, done);
    } else {
      study.updateTopic(item.id, { status: done ? 'done' : 'not_started' });
    }
  };
}
