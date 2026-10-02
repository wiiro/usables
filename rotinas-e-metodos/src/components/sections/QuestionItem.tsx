import { MessageSquareReply, RotateCcw } from 'lucide-react';
import type { FormEvent } from 'react';
import { useId, useState } from 'react';
import { formatShortDate } from '../../domain/dates';
import { useToday } from '../../hooks/useToday';
import { useSectionActions } from '../../store/actions/useSectionActions';
import type { Question } from '../../types/sections';
import { Button } from '../ui/Button';
import { Field, TextArea } from '../ui/form';
import { cancelOnEscape } from './cancelOnEscape';
import { MarkdownView } from './MarkdownView';
import { EntryCard } from './SectionParts';

type Mode = 'view' | 'answer' | 'edit';

export function QuestionItem({ question }: { question: Question }) {
  const { reopenQuestion, deleteQuestion } = useSectionActions();
  const today = useToday();
  const [mode, setMode] = useState<Mode>('view');
  const open = question.status === 'open';

  if (mode !== 'view') return <QuestionForm question={question} mode={mode} onDone={() => setMode('view')} />;

  const meta = (
    <>
      <span
        className={`rounded-md px-1.5 py-0.5 font-medium ${open ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}
      >
        {open ? 'Em aberto' : 'Respondida'}
      </span>
      {question.answeredOn && <span>em {formatShortDate(question.answeredOn, today)}</span>}
    </>
  );

  const toggle = open ? (
    <Button size="sm" variant="ghost" onClick={() => setMode('answer')}>
      <MessageSquareReply className="size-4" aria-hidden />
      Responder
    </Button>
  ) : (
    <Button size="sm" variant="ghost" onClick={() => reopenQuestion(question.id)}>
      <RotateCcw className="size-4" aria-hidden />
      Reabrir
    </Button>
  );

  return (
    <EntryCard
      meta={meta}
      title={<span className="whitespace-pre-wrap">{question.question}</span>}
      actions={toggle}
      onEdit={() => setMode('edit')}
      onDelete={() => deleteQuestion(question.id)}
      deleteWhat="esta dúvida"
    >
      {question.answer && <MarkdownView source={question.answer} className="mt-1 border-l-2 border-line pl-3 text-fg-muted" />}
    </EntryCard>
  );
}

interface QuestionFormProps {
  question: Question;
  /** "answer": só a resposta, e salvar marca como respondida. "edit": pergunta e resposta, sem mudar o status. */
  mode: 'answer' | 'edit';
  onDone: () => void;
}

function QuestionForm({ question, mode, onDone }: QuestionFormProps) {
  const { answerQuestion, updateQuestion } = useSectionActions();
  const [text, setText] = useState(question.question);
  const [answer, setAnswer] = useState(question.answer);
  const id = useId();
  const canSubmit = mode === 'answer' ? answer.trim() !== '' : text.trim() !== '';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (mode === 'answer') answerQuestion(question.id, answer);
    else updateQuestion(question.id, { question: text.trim(), answer: answer.trim() });
    onDone();
  };

  return (
    <li>
      <form onSubmit={submit} onKeyDown={cancelOnEscape(onDone)} className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface p-4">
        {mode === 'edit' ? (
          <Field label="Dúvida" htmlFor={`${id}-question`}>
            <TextArea id={`${id}-question`} rows={2} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
          </Field>
        ) : (
          <p className="text-sm font-medium whitespace-pre-wrap">{question.question}</p>
        )}
        <Field label="Resposta" htmlFor={`${id}-answer`} hint="Aceita Markdown.">
          <TextArea id={`${id}-answer`} rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} autoFocus={mode === 'answer'} />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {mode === 'answer' ? 'Salvar resposta' : 'Salvar'}
          </Button>
          <Button onClick={onDone}>Cancelar</Button>
        </div>
      </form>
    </li>
  );
}
