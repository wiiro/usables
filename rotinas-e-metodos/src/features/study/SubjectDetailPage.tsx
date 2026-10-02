import { Pencil, SearchX, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { subjectName, topicCountLabel } from '../../domain/labels';
import { subjectProgress } from '../../domain/progress';
import { useItemDrawer } from '../../hooks/useItemDrawer';
import { useStudyActions } from '../../store/actions/useStudyActions';
import { useAppState } from '../../store/StoreContext';
import type { Subject } from '../../types/study';
import { EditSubjectDrawer } from './components/SubjectDrawers';
import { TopicDrawerHost } from './components/TopicDrawer';
import { TopicList } from './components/TopicList';

/** /estudos/materias/:subjectId */
export function SubjectDetailPage() {
  const { subjectId = '' } = useParams();
  const { subjects, topics } = useAppState();
  const drawer = useItemDrawer('topico');
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);

  const subject = subjects.find((s) => s.id === subjectId);
  const subjectTopics = useMemo(() => topics.filter((topic) => topic.subjectId === subjectId), [topics, subjectId]);

  if (!subject) {
    return (
      <EmptyState icon={SearchX} title="Matéria não encontrada">
        Ela pode ter sido excluída.{' '}
        <Link to="/estudos" className="font-medium text-accent underline">
          Voltar para as matérias
        </Link>
      </EmptyState>
    );
  }

  const name = subjectName(subject);
  const actions = (
    <>
      <Button onClick={() => setDialog('edit')}>
        <Pencil className="size-4" aria-hidden />
        Editar
      </Button>
      <Button variant="ghost" onClick={() => setDialog('delete')} aria-label="Excluir matéria" title="Excluir matéria">
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </>
  );

  return (
    <>
      <PageHeader title={name} color={subject.color} back={{ to: '/estudos', label: 'Matérias' }} description={subject.description || undefined} actions={actions}>
        <div className="mt-4 flex max-w-2xl flex-col gap-1.5">
          <ProgressBar value={subjectProgress(subjectTopics)} label={`Progresso de ${name}`} color={subject.color} />
          <span className="text-xs text-fg-muted">{topicCountLabel(subjectTopics)}</span>
        </div>
      </PageHeader>
      <div className="max-w-4xl p-6 md:p-8">
        <TopicList subjectId={subject.id} topics={subjectTopics} onOpen={(id) => drawer.open(id)} />
      </div>
      <TopicDrawerHost />
      {dialog === 'edit' && <EditSubjectDrawer subject={subject} onClose={() => setDialog(null)} />}
      {dialog === 'delete' && <DeleteSubjectDialog subject={subject} topicCount={subjectTopics.length} onCancel={() => setDialog(null)} />}
    </>
  );
}

function DeleteSubjectDialog({ subject, topicCount, onCancel }: { subject: Subject; topicCount: number; onCancel: () => void }) {
  const { deleteSubject } = useStudyActions();
  const navigate = useNavigate();
  return (
    <ConfirmDialog
      title={`Excluir a matéria "${subjectName(subject)}"?`}
      confirmLabel="Excluir matéria"
      onCancel={onCancel}
      onConfirm={() => {
        deleteSubject(subject.id);
        navigate('/estudos', { replace: true });
      }}
    >
      {topicCount > 0 &&
        `${topicCount === 1 ? 'O tópico dela também será excluído' : `Os ${topicCount} tópicos dela também serão excluídos`}, ` +
          'com tudo o que estiver registrado neles. '}
      Não dá para desfazer.
    </ConfirmDialog>
  );
}
