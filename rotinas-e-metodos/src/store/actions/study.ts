import type { ID, ISODate, ISODateTime, Recurrence } from '../../types/common';
import type { AppState } from '../../types/state';
import type { Subject, Topic } from '../../types/study';
import type { CreateMeta } from './common';
import { findById, removeSectionsOf } from './common';
import { applyRecurrence, clearRecurrence, setOccurrenceDone } from './recurring';

// Matérias e tópicos. Mesma organização das ações de Trabalho.

export type SubjectFields = Pick<Subject, 'name' | 'description' | 'color'>;

export function createSubject(draft: AppState, fields: SubjectFields, { id, now }: CreateMeta): void {
  draft.subjects.push({ id, createdAt: now, updatedAt: now, ...fields, name: fields.name.trim() });
}

export function updateSubject(draft: AppState, id: ID, patch: Partial<SubjectFields>, now: ISODateTime): void {
  Object.assign(findById(draft.subjects, id, 'Matéria'), patch, { updatedAt: now });
}

/** Exclui a matéria, os tópicos dela e as seções desses tópicos. */
export function deleteSubject(draft: AppState, id: ID): void {
  findById(draft.subjects, id, 'Matéria');
  const topicIds = new Set(draft.topics.filter((topic) => topic.subjectId === id).map((topic) => topic.id));
  draft.subjects = draft.subjects.filter((subject) => subject.id !== id);
  draft.topics = draft.topics.filter((topic) => topic.subjectId !== id);
  removeSectionsOf(draft, 'topic', topicIds);
}

export function createTopic(
  draft: AppState,
  input: { subjectId: ID; title: string; plannedDate?: ISODate | null },
  { id, now }: CreateMeta,
): void {
  findById(draft.subjects, input.subjectId, 'Matéria');
  const order = draft.topics.reduce((max, topic) => Math.max(max, topic.order), 0) + 1;
  draft.topics.push({
    id,
    createdAt: now,
    updatedAt: now,
    subjectId: input.subjectId,
    title: input.title.trim(),
    status: 'not_started',
    plannedDate: input.plannedDate ?? null,
    recurrence: null,
    completedOccurrences: [],
    notes: '',
    order,
  });
}

export type TopicPatch = Partial<Pick<Topic, 'title' | 'status' | 'notes' | 'subjectId'>>;

export function updateTopic(draft: AppState, id: ID, patch: TopicPatch, now: ISODateTime): void {
  const topic = findById(draft.topics, id, 'Tópico');
  if (patch.subjectId !== undefined) findById(draft.subjects, patch.subjectId, 'Matéria');
  Object.assign(topic, patch, { updatedAt: now });
}

/** Tirar a data também tira a repetição, que começa nela. */
export function setTopicPlannedDate(draft: AppState, id: ID, plannedDate: ISODate | null, now: ISODateTime): void {
  const topic = findById(draft.topics, id, 'Tópico');
  topic.plannedDate = plannedDate;
  if (!plannedDate) clearRecurrence(topic);
  topic.updatedAt = now;
}

export function setTopicRecurrence(draft: AppState, id: ID, recurrence: Recurrence | null, now: ISODateTime): void {
  const topic = findById(draft.topics, id, 'Tópico');
  applyRecurrence(topic, topic.plannedDate, recurrence, 'data planejada');
  topic.updatedAt = now;
}

export function setTopicOccurrenceDone(draft: AppState, id: ID, date: ISODate, done: boolean, now: ISODateTime): void {
  const topic = findById(draft.topics, id, 'Tópico');
  setOccurrenceDone(topic, topic.plannedDate, date, done);
  topic.updatedAt = now;
}

/** Exclui o tópico e as seções dele (anotações vão junto; avanços, ideias e dúvidas também). */
export function deleteTopic(draft: AppState, id: ID): void {
  findById(draft.topics, id, 'Tópico');
  draft.topics = draft.topics.filter((topic) => topic.id !== id);
  removeSectionsOf(draft, 'topic', new Set([id]));
}
