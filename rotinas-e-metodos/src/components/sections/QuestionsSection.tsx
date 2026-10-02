import { Plus } from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { countOpenQuestions, itemsOf, sortQuestions } from '../../domain/sections';
import { useSectionActions } from '../../store/actions/useSectionActions';
import { useAppState } from '../../store/StoreContext';
import type { ID } from '../../types/common';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/form';
import { cancelOnEscape } from './cancelOnEscape';
import { QuestionItem } from './QuestionItem';
import { EmptyHint, SectionHeader } from './SectionParts';

/** "Dúvidas": perguntas em aberto sobre o tópico, que podem ser respondidas e reabertas. */
export function QuestionsSection({ topicId }: { topicId: ID }) {
  const { questions } = useAppState();
  const { addQuestion } = useSectionActions();
  const [adding, setAdding] = useState(false);
  const list = useMemo(() => sortQuestions(itemsOf(questions, { ownerType: 'topic', ownerId: topicId })), [questions, topicId]);
  const open = countOpenQuestions(list);

  const answered = list.length - open;
  const summary =
    list.length === 0
      ? 'Perguntas em aberto sobre o tópico.'
      : `${open} em aberto · ${answered} ${answered === 1 ? 'respondida' : 'respondidas'}`;
  const addButton = !adding && (
    <Button size="sm" onClick={() => setAdding(true)}>
      <Plus className="size-4" aria-hidden />
      Nova dúvida
    </Button>
  );

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader title="Dúvidas" summary={summary} action={addButton} />
      {adding && (
        <QuestionForm
          onSubmit={(question) => {
            addQuestion(topicId, question);
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {list.length === 0 && !adding && <EmptyHint>Nenhuma dúvida registrada.</EmptyHint>}
      <ul className="flex flex-col gap-2">
        {list.map((question) => (
          <QuestionItem key={question.id} question={question} />
        ))}
      </ul>
    </section>
  );
}

function QuestionForm({ onSubmit, onCancel }: { onSubmit: (question: string) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (question.trim()) onSubmit(question);
  };

  return (
    <form onSubmit={submit} onKeyDown={cancelOnEscape(onCancel)} className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface p-4">
      <TextArea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={2}
        autoFocus
        aria-label="Dúvida"
        placeholder="Qual é a dúvida? Ex.: por que usar mediana em vez de média aqui?"
      />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={!question.trim()}>
          Registrar dúvida
        </Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
