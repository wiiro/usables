import type { BaseEntity, ID, ISODate, OwnerRef } from './common';

// Seções em lista, ligadas a um projeto, tarefa ou tópico pelo OwnerRef.
// "Anotações" não está aqui: é um texto único, no campo `notes` do próprio item.

export interface Idea extends BaseEntity, OwnerRef {
  title: string;
  description: string;
  date: ISODate;
}

export const BLOCKER_STATUSES = ['active', 'resolved'] as const;
export type BlockerStatus = (typeof BLOCKER_STATUSES)[number];

export interface Blocker extends BaseEntity, OwnerRef {
  /** A data de criação do bloqueio é o createdAt. */
  description: string;
  status: BlockerStatus;
  resolvedOn: ISODate | null;
}

/** "Avanços": registro cronológico do que foi feito ou estudado. */
export interface ProgressLog extends BaseEntity, OwnerRef {
  date: ISODate;
  /** Markdown. */
  content: string;
}

export const QUESTION_STATUSES = ['open', 'answered'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

/** "Dúvidas": existem só nos tópicos de estudo. */
export interface Question extends BaseEntity {
  ownerType: 'topic';
  ownerId: ID;
  question: string;
  answer: string;
  status: QuestionStatus;
  answeredOn: ISODate | null;
}
