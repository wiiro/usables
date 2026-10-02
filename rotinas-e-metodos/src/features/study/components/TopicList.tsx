import { CircleHelp, NotebookPen, Plus, Repeat } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/form';
import { formatShortDate, isTopicOverdue } from '../../../domain/dates';
import { topicTitle } from '../../../domain/labels';
import { useToday } from '../../../hooks/useToday';
import { useStudyActions } from '../../../store/actions/useStudyActions';
import { useAppState } from '../../../store/StoreContext';
import type { ID } from '../../../types/common';
import type { Topic } from '../../../types/study';
import { TopicStatusSelect } from './TopicStatusSelect';

interface TopicListProps {
  subjectId: ID;
  topics: Topic[];
  onOpen: (topicId: ID) => void;
}

/** Tópicos da matéria na ordem em que foram criados (a ordem do plano de estudo). */
export function TopicList({ subjectId, topics, onOpen }: TopicListProps) {
  const { createTopic } = useStudyActions();
  const { questions, progressLogs } = useAppState();
  const today = useToday();
  const [title, setTitle] = useState('');
  const sorted = useMemo(() => [...topics].sort((a, b) => a.order - b.order), [topics]);
  const counts = useMemo(() => countByTopic(questions, progressLogs), [questions, progressLogs]);

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    createTopic(subjectId, title);
    setTitle('');
  };

  return (
    <section aria-labelledby="topics-heading" className="flex flex-col gap-3">
      <h2 id="topics-heading" className="text-sm font-semibold">
        Tópicos
      </h2>
      <form onSubmit={add} className="flex gap-2">
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Novo tópico: digite o título e tecle Enter" aria-label="Título do novo tópico" />
        <Button type="submit" variant="primary" disabled={!title.trim()} className="h-auto">
          <Plus className="size-4" aria-hidden />
          Adicionar
        </Button>
      </form>
      {sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-fg-muted">
          Nenhum tópico ainda. Depois de criar, clique num tópico para anotações, avanços, ideias e dúvidas.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {sorted.map((topic) => (
            <TopicRow key={topic.id} topic={topic} today={today} counts={counts.get(topic.id)} onOpen={() => onOpen(topic.id)} />
          ))}
        </ul>
      )}
    </section>
  );
}

interface TopicCounts {
  openQuestions: number;
  logs: number;
}

function countByTopic(questions: { ownerId: ID; status: string }[], logs: { ownerType: string; ownerId: ID }[]) {
  const counts = new Map<ID, TopicCounts>();
  const get = (id: ID) => counts.get(id) ?? counts.set(id, { openQuestions: 0, logs: 0 }).get(id)!;
  for (const q of questions) if (q.status === 'open') get(q.ownerId).openQuestions += 1;
  for (const log of logs) if (log.ownerType === 'topic') get(log.ownerId).logs += 1;
  return counts;
}

function TopicRow({ topic, today, counts, onOpen }: { topic: Topic; today: Date; counts?: TopicCounts; onOpen: () => void }) {
  const overdue = isTopicOverdue(topic, today);
  const done = topic.status === 'done';

  return (
    <li className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-muted/60">
      <TopicStatusSelect topic={topic} />
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
        <span className={`max-w-full truncate text-sm font-medium ${done ? 'text-fg-muted line-through' : ''}`}>{topicTitle(topic)}</span>
        <span className="flex flex-wrap items-center gap-x-3 text-xs text-fg-muted empty:hidden">
          {topic.recurrence && (
            <span className="inline-flex items-center gap-1">
              <Repeat className="size-3.5" aria-hidden />
              Repete
            </span>
          )}
          {!!counts?.openQuestions && (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
              <CircleHelp className="size-3.5" aria-hidden />
              {counts.openQuestions} em aberto
            </span>
          )}
          {!!counts?.logs && (
            <span className="inline-flex items-center gap-1">
              <NotebookPen className="size-3.5" aria-hidden />
              {counts.logs} {counts.logs === 1 ? 'avanço' : 'avanços'}
            </span>
          )}
        </span>
      </button>
      <span className={`w-24 shrink-0 text-right text-xs tabular-nums ${overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-fg-muted'}`}>
        {topic.plannedDate ? formatShortDate(topic.plannedDate, today) : '—'}
        {overdue && <span className="block">atrasado</span>}
      </span>
    </li>
  );
}
