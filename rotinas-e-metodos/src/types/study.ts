import type { BaseEntity, ID, ISODate, Recurrence } from './common';

export const TOPIC_STATUSES = ['not_started', 'studying', 'done'] as const;
export type TopicStatus = (typeof TOPIC_STATUSES)[number];

/** Matéria / tema de estudo. */
export interface Subject extends BaseEntity {
  name: string;
  description: string;
  /** Cor em hexadecimal, ex. '#059669'. */
  color: string;
}

export interface Topic extends BaseEntity {
  subjectId: ID;
  title: string;
  status: TopicStatus;
  plannedDate: ISODate | null;
  recurrence: Recurrence | null;
  /** Datas das ocorrências marcadas como feitas (só para tópicos recorrentes). */
  completedOccurrences: ISODate[];
  /** Seção "Anotações", em Markdown. */
  notes: string;
  /** Posição na lista de tópicos da matéria. */
  order: number;
}
