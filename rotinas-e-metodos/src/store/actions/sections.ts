import type { ID, ISODate, ISODateTime, OwnerRef, OwnerType } from '../../types/common';
import type { Blocker, BlockerStatus, Idea, ProgressLog, Question } from '../../types/sections';
import type { AppState } from '../../types/state';
import type { CreateMeta } from './common';
import { findById } from './common';

// Ideias, bloqueios e avanços de projetos, tarefas e (na Etapa 5) tópicos.
// "Anotações" não está aqui: é o campo `notes` do próprio item.

export type IdeaFields = Pick<Idea, 'title' | 'description' | 'date'>;
export type ProgressLogFields = Pick<ProgressLog, 'date' | 'content'>;

/** O dono precisa existir: evita seções órfãs se o item foi excluído em outra aba. */
function assertOwner(draft: AppState, { ownerType, ownerId }: OwnerRef): void {
  const owners: Record<OwnerType, readonly { id: ID }[]> = {
    project: draft.projects,
    task: draft.tasks,
    topic: draft.topics,
  };
  if (!owners[ownerType].some((owner) => owner.id === ownerId)) {
    throw new Error(`Dono da seção não encontrado: ${ownerType} ${ownerId}`);
  }
}

const ownerOf = ({ ownerType, ownerId }: OwnerRef): OwnerRef => ({ ownerType, ownerId });

// ── Ideias ──────────────────────────────────────────────────────────────────

export function addIdea(draft: AppState, owner: OwnerRef, fields: IdeaFields, { id, now }: CreateMeta): void {
  assertOwner(draft, owner);
  draft.ideas.push({ id, createdAt: now, updatedAt: now, ...ownerOf(owner), ...fields, title: fields.title.trim() });
}

export function updateIdea(draft: AppState, id: ID, patch: Partial<IdeaFields>, now: ISODateTime): void {
  Object.assign(findById(draft.ideas, id, 'Ideia'), patch, { updatedAt: now });
}

export function deleteIdea(draft: AppState, id: ID): void {
  findById(draft.ideas, id, 'Ideia');
  draft.ideas = draft.ideas.filter((idea) => idea.id !== id);
}

// ── Bloqueios ───────────────────────────────────────────────────────────────

export function addBlocker(draft: AppState, owner: OwnerRef, description: string, { id, now }: CreateMeta): void {
  assertOwner(draft, owner);
  draft.blockers.push({
    id,
    createdAt: now,
    updatedAt: now,
    ...ownerOf(owner),
    description: description.trim(),
    status: 'active',
    resolvedOn: null,
  });
}

export function updateBlocker(
  draft: AppState,
  id: ID,
  patch: Partial<Pick<Blocker, 'description' | 'resolvedOn'>>,
  now: ISODateTime,
): void {
  Object.assign(findById(draft.blockers, id, 'Bloqueio'), patch, { updatedAt: now });
}

/** Resolver registra o dia de hoje como data de resolução; reabrir apaga essa data. */
export function setBlockerStatus(draft: AppState, id: ID, status: BlockerStatus, today: ISODate, now: ISODateTime): void {
  const blocker = findById(draft.blockers, id, 'Bloqueio');
  blocker.status = status;
  blocker.resolvedOn = status === 'resolved' ? today : null;
  blocker.updatedAt = now;
}

export function deleteBlocker(draft: AppState, id: ID): void {
  findById(draft.blockers, id, 'Bloqueio');
  draft.blockers = draft.blockers.filter((blocker) => blocker.id !== id);
}

// ── Avanços ─────────────────────────────────────────────────────────────────

export function addProgressLog(draft: AppState, owner: OwnerRef, fields: ProgressLogFields, { id, now }: CreateMeta): void {
  assertOwner(draft, owner);
  draft.progressLogs.push({ id, createdAt: now, updatedAt: now, ...ownerOf(owner), ...fields });
}

export function updateProgressLog(draft: AppState, id: ID, patch: Partial<ProgressLogFields>, now: ISODateTime): void {
  Object.assign(findById(draft.progressLogs, id, 'Avanço'), patch, { updatedAt: now });
}

export function deleteProgressLog(draft: AppState, id: ID): void {
  findById(draft.progressLogs, id, 'Avanço');
  draft.progressLogs = draft.progressLogs.filter((log) => log.id !== id);
}

// ── Dúvidas (só tópicos) ────────────────────────────────────────────────────

export function addQuestion(draft: AppState, topicId: ID, question: string, { id, now }: CreateMeta): void {
  assertOwner(draft, { ownerType: 'topic', ownerId: topicId });
  draft.questions.push({
    id,
    createdAt: now,
    updatedAt: now,
    ownerType: 'topic',
    ownerId: topicId,
    question: question.trim(),
    answer: '',
    status: 'open',
    answeredOn: null,
  });
}

export function updateQuestion(draft: AppState, id: ID, patch: Partial<Pick<Question, 'question' | 'answer'>>, now: ISODateTime): void {
  Object.assign(findById(draft.questions, id, 'Dúvida'), patch, { updatedAt: now });
}

/** Responder grava a resposta e a data de hoje; a dúvida passa a "respondida". */
export function answerQuestion(draft: AppState, id: ID, answer: string, today: ISODate, now: ISODateTime): void {
  const question = findById(draft.questions, id, 'Dúvida');
  question.answer = answer.trim();
  question.status = 'answered';
  question.answeredOn = today;
  question.updatedAt = now;
}

/** Volta a dúvida para "em aberto"; a resposta escrita é mantida. */
export function reopenQuestion(draft: AppState, id: ID, now: ISODateTime): void {
  const question = findById(draft.questions, id, 'Dúvida');
  question.status = 'open';
  question.answeredOn = null;
  question.updatedAt = now;
}

export function deleteQuestion(draft: AppState, id: ID): void {
  findById(draft.questions, id, 'Dúvida');
  draft.questions = draft.questions.filter((question) => question.id !== id);
}
