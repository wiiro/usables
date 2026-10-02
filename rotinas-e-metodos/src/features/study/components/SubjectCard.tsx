import { CircleHelp } from 'lucide-react';
import { Link } from 'react-router';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { subjectName, topicCountLabel } from '../../../domain/labels';
import { subjectProgress } from '../../../domain/progress';
import type { Subject, Topic } from '../../../types/study';

interface SubjectCardProps {
  subject: Subject;
  topics: Topic[];
  openQuestions: number;
}

export function SubjectCard({ subject, topics, openQuestions }: SubjectCardProps) {
  const name = subjectName(subject);

  return (
    <Link
      to={`/estudos/materias/${subject.id}`}
      className="flex flex-col rounded-xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      style={{ borderTop: `4px solid ${subject.color}` }}
    >
      <h2 className="truncate font-semibold">{name}</h2>
      {subject.description && <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{subject.description}</p>}
      <div className="mt-auto pt-4">
        <ProgressBar value={subjectProgress(topics)} label={`Progresso de ${name}`} color={subject.color} size="sm" />
        <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-fg-muted">
          <span>{topicCountLabel(topics)}</span>
          {openQuestions > 0 && (
            <span className="inline-flex items-center gap-1">
              <CircleHelp className="size-3.5" aria-hidden />
              {openQuestions === 1 ? '1 dúvida em aberto' : `${openQuestions} dúvidas em aberto`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
