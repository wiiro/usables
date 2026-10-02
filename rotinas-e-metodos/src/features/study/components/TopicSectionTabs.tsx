import { useId, useMemo, useState } from 'react';
import { IdeasSection } from '../../../components/sections/IdeasSection';
import { NotesSection } from '../../../components/sections/NotesSection';
import { ProgressLogSection } from '../../../components/sections/ProgressLogSection';
import { QuestionsSection } from '../../../components/sections/QuestionsSection';
import { DateInput, Field, Select } from '../../../components/ui/form';
import { RecurrenceField } from '../../../components/ui/RecurrenceField';
import { Tabs } from '../../../components/ui/Tabs';
import { isTopicOverdue } from '../../../domain/dates';
import { TOPIC_STATUS_LABELS, subjectName } from '../../../domain/labels';
import { countOpenQuestions, itemsOf } from '../../../domain/sections';
import { useToday } from '../../../hooks/useToday';
import { useStudyActions } from '../../../store/actions/useStudyActions';
import { useAppState } from '../../../store/StoreContext';
import type { OwnerRef } from '../../../types/common';
import type { Topic } from '../../../types/study';
import { TOPIC_STATUSES } from '../../../types/study';

type TopicTab = 'details' | 'notes' | 'logs' | 'ideas' | 'questions';

/** Abas do painel do tópico: Detalhes, Anotações, Avanços, Ideias e Dúvidas. */
export function TopicSectionTabs({ topic }: { topic: Topic }) {
  const { ideas, progressLogs, questions } = useAppState();
  const { updateTopic } = useStudyActions();
  const [tab, setTab] = useState<TopicTab>('details');
  const owner = useMemo<OwnerRef>(() => ({ ownerType: 'topic', ownerId: topic.id }), [topic.id]);

  const items = [
    { id: 'details', label: 'Detalhes' },
    { id: 'notes', label: 'Anotações' },
    { id: 'logs', label: 'Avanços', count: itemsOf(progressLogs, owner).length },
    { id: 'ideas', label: 'Ideias', count: itemsOf(ideas, owner).length },
    { id: 'questions', label: 'Dúvidas', count: countOpenQuestions(itemsOf(questions, owner)) },
  ] as const;

  return (
    <Tabs label="Seções do tópico" items={items} value={tab} onChange={setTab}>
      {tab === 'details' && <TopicDetailsFields topic={topic} />}
      {tab === 'notes' && <NotesSection value={topic.notes} onChange={(notes) => updateTopic(topic.id, { notes })} />}
      {tab === 'logs' && <ProgressLogSection owner={owner} />}
      {tab === 'ideas' && <IdeasSection owner={owner} />}
      {tab === 'questions' && <QuestionsSection topicId={topic.id} />}
    </Tabs>
  );
}

function TopicDetailsFields({ topic }: { topic: Topic }) {
  const { subjects } = useAppState();
  const actions = useStudyActions();
  const today = useToday();
  const id = useId();
  const sortedSubjects = useMemo(() => [...subjects].sort((a, b) => subjectName(a).localeCompare(subjectName(b), 'pt-BR')), [subjects]);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor={`${id}-status`}>
          <Select
            id={`${id}-status`}
            value={topic.status}
            onChange={(e) => {
              const status = TOPIC_STATUSES.find((s) => s === e.target.value);
              if (status) actions.updateTopic(topic.id, { status });
            }}
          >
            {TOPIC_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TOPIC_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Data planejada"
          htmlFor={`${id}-date`}
          warning={isTopicOverdue(topic, today) ? 'Atrasado.' : undefined}
          hint={topic.recurrence ? 'Início da repetição.' : undefined}
        >
          <DateInput id={`${id}-date`} value={topic.plannedDate} onChange={(date) => actions.setTopicPlannedDate(topic.id, date)} />
        </Field>
        <Field label="Matéria" htmlFor={`${id}-subject`}>
          <Select id={`${id}-subject`} value={topic.subjectId} onChange={(e) => actions.updateTopic(topic.id, { subjectId: e.target.value })}>
            {sortedSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subjectName(subject)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <RecurrenceField
        value={topic.recurrence}
        startDate={topic.plannedDate}
        dateLabel="data planejada"
        onChange={(recurrence) => actions.setTopicRecurrence(topic.id, recurrence)}
      />
    </div>
  );
}
