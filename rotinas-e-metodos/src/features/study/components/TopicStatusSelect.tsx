import { TOPIC_STATUS_LABELS, topicTitle } from '../../../domain/labels';
import { useStudyActions } from '../../../store/actions/useStudyActions';
import type { Topic } from '../../../types/study';
import { TOPIC_STATUSES } from '../../../types/study';

const STYLES: Record<Topic['status'], string> = {
  not_started: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  studying: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

/** Status do tópico direto na lista, sem abrir o painel. */
export function TopicStatusSelect({ topic }: { topic: Topic }) {
  const { updateTopic } = useStudyActions();
  return (
    <select
      value={topic.status}
      onChange={(event) => {
        const status = TOPIC_STATUSES.find((s) => s === event.target.value);
        if (status) updateTopic(topic.id, { status });
      }}
      aria-label={`Status de "${topicTitle(topic)}"`}
      className={`w-32 shrink-0 cursor-pointer rounded-md border-0 px-2 py-1 text-xs font-medium focus:ring-2 focus:ring-accent/40 focus:outline-none ${STYLES[topic.status]}`}
    >
      {TOPIC_STATUSES.map((status) => (
        <option key={status} value={status}>
          {TOPIC_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}
