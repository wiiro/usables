import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Drawer } from '../../../components/ui/Drawer';
import { OccurrenceBanner } from '../../../components/ui/OccurrenceBanner';
import { subjectName, topicTitle } from '../../../domain/labels';
import { useItemDrawer } from '../../../hooks/useItemDrawer';
import { useStudyActions } from '../../../store/actions/useStudyActions';
import { useAppState } from '../../../store/StoreContext';
import type { ISODate } from '../../../types/common';
import type { Topic } from '../../../types/study';
import { TopicSectionTabs } from './TopicSectionTabs';

interface TopicDrawerProps {
  topic: Topic;
  occurrence?: ISODate | null;
  onClose: () => void;
}

/** Painel de um tópico de estudo. */
export function TopicDrawer({ topic, occurrence = null, onClose }: TopicDrawerProps) {
  const { subjects } = useAppState();
  const { updateTopic, deleteTopic, setTopicOccurrenceDone } = useStudyActions();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const subject = subjects.find((s) => s.id === topic.subjectId);

  const eyebrow = subject && (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-sm" style={{ backgroundColor: subject.color }} aria-hidden />
      {subjectName(subject)}
    </span>
  );

  const footer = (
    <>
      <Button variant="ghost" onClick={() => setConfirmingDelete(true)} className="text-red-600 dark:text-red-400">
        <Trash2 className="size-4" aria-hidden />
        Excluir tópico
      </Button>
      <span className="ml-auto text-xs text-fg-muted">Alterações salvas automaticamente</span>
    </>
  );

  return (
    <Drawer title="Tópico" eyebrow={eyebrow} onClose={onClose} footer={footer}>
      <div className="flex flex-col gap-5">
        <input
          value={topic.title}
          onChange={(event) => updateTopic(topic.id, { title: event.target.value })}
          placeholder="Título do tópico"
          aria-label="Título do tópico"
          className="w-full rounded-lg bg-transparent px-1 py-1 text-xl font-semibold placeholder:text-fg-muted focus:bg-surface-muted/60 focus:outline-none"
        />
        <OccurrenceBanner
          date={occurrence}
          recurrence={topic.recurrence}
          startDate={topic.plannedDate}
          completedOccurrences={topic.completedOccurrences}
          onToggle={(date, done) => setTopicOccurrenceDone(topic.id, date, done)}
        />
        <TopicSectionTabs key={topic.id} topic={topic} />
      </div>
      {confirmingDelete && (
        <ConfirmDialog
          title={`Excluir "${topicTitle(topic)}"?`}
          confirmLabel="Excluir tópico"
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => {
            onClose();
            deleteTopic(topic.id);
          }}
        >
          O tópico e tudo o que estiver registrado nele (anotações, avanços, ideias e dúvidas) serão excluídos. Não dá para desfazer.
        </ConfirmDialog>
      )}
    </Drawer>
  );
}

/** Mostra o painel do tópico indicado no endereço (?topico=…), em qualquer tela. */
export function TopicDrawerHost() {
  const { topics } = useAppState();
  const drawer = useItemDrawer('topico');
  const topic = drawer.openId ? topics.find((t) => t.id === drawer.openId) : undefined;
  return topic ? <TopicDrawer topic={topic} occurrence={drawer.occurrence} onClose={drawer.close} /> : null;
}
