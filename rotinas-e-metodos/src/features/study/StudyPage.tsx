import { GraduationCap, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { subjectName } from '../../domain/labels';
import { useAppState } from '../../store/StoreContext';
import type { ID } from '../../types/common';
import type { Topic } from '../../types/study';
import { StudyTabs } from './components/StudyTabs';
import { NewSubjectDrawer } from './components/SubjectDrawers';
import { SubjectCard } from './components/SubjectCard';

/** /estudos: as matérias, cada uma com sua barra de progresso. */
export function StudyPage() {
  const { subjects, topics, questions } = useAppState();
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const sorted = useMemo(() => [...subjects].sort((a, b) => subjectName(a).localeCompare(subjectName(b), 'pt-BR')), [subjects]);
  const { topicsBySubject, openBySubject } = useMemo(() => groupBySubject(topics, questions), [topics, questions]);

  const newButton = (
    <Button variant="primary" onClick={() => setCreating(true)}>
      <Plus className="size-4" aria-hidden />
      Nova matéria
    </Button>
  );

  return (
    <>
      <PageHeader title="Estudos" description="Matérias e tópicos." actions={newButton}>
        <StudyTabs />
      </PageHeader>
      <div className="p-6 md:p-8">
        {subjects.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Nenhuma matéria ainda">
            <p>Crie a primeira matéria (ou tema) para organizar os tópicos de estudo.</p>
            <div className="mt-4">{newButton}</div>
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                topics={topicsBySubject.get(subject.id) ?? []}
                openQuestions={openBySubject.get(subject.id) ?? 0}
              />
            ))}
          </div>
        )}
      </div>
      {creating && (
        <NewSubjectDrawer
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            navigate(`/estudos/materias/${id}`);
          }}
        />
      )}
    </>
  );
}

function groupBySubject(topics: Topic[], questions: { ownerId: ID; status: string }[]) {
  const topicsBySubject = new Map<ID, Topic[]>();
  const subjectOfTopic = new Map<ID, ID>();
  for (const topic of topics) {
    topicsBySubject.set(topic.subjectId, [...(topicsBySubject.get(topic.subjectId) ?? []), topic]);
    subjectOfTopic.set(topic.id, topic.subjectId);
  }
  const openBySubject = new Map<ID, number>();
  for (const question of questions) {
    const subjectId = subjectOfTopic.get(question.ownerId);
    if (subjectId && question.status === 'open') openBySubject.set(subjectId, (openBySubject.get(subjectId) ?? 0) + 1);
  }
  return { topicsBySubject, openBySubject };
}
