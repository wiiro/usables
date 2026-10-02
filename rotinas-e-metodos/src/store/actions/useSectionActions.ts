import { useMemo } from 'react';
import { toISODate } from '../../domain/dates';
import type { ID, OwnerRef } from '../../types/common';
import type { Blocker, BlockerStatus, Question } from '../../types/sections';
import { useStore } from '../StoreContext';
import type { IdeaFields, ProgressLogFields } from './sections';
import * as sections from './sections';

const now = () => new Date().toISOString();
const meta = () => ({ id: crypto.randomUUID(), now: now() });

/** Ações das seções (ideias, bloqueios, avanços), já ligadas ao store. */
export function useSectionActions() {
  const store = useStore();

  return useMemo(
    () => ({
      addIdea: (owner: OwnerRef, fields: IdeaFields) => store.update((d) => sections.addIdea(d, owner, fields, meta())),
      updateIdea: (id: ID, patch: Partial<IdeaFields>) => store.update((d) => sections.updateIdea(d, id, patch, now())),
      deleteIdea: (id: ID) => store.update((d) => sections.deleteIdea(d, id)),

      addBlocker: (owner: OwnerRef, description: string) =>
        store.update((d) => sections.addBlocker(d, owner, description, meta())),
      updateBlocker: (id: ID, patch: Partial<Pick<Blocker, 'description' | 'resolvedOn'>>) =>
        store.update((d) => sections.updateBlocker(d, id, patch, now())),
      setBlockerStatus: (id: ID, status: BlockerStatus) =>
        store.update((d) => sections.setBlockerStatus(d, id, status, toISODate(new Date()), now())),
      deleteBlocker: (id: ID) => store.update((d) => sections.deleteBlocker(d, id)),

      addProgressLog: (owner: OwnerRef, fields: ProgressLogFields) =>
        store.update((d) => sections.addProgressLog(d, owner, fields, meta())),
      updateProgressLog: (id: ID, patch: Partial<ProgressLogFields>) =>
        store.update((d) => sections.updateProgressLog(d, id, patch, now())),
      deleteProgressLog: (id: ID) => store.update((d) => sections.deleteProgressLog(d, id)),

      addQuestion: (topicId: ID, question: string) => store.update((d) => sections.addQuestion(d, topicId, question, meta())),
      updateQuestion: (id: ID, patch: Partial<Pick<Question, 'question' | 'answer'>>) =>
        store.update((d) => sections.updateQuestion(d, id, patch, now())),
      answerQuestion: (id: ID, answer: string) =>
        store.update((d) => sections.answerQuestion(d, id, answer, toISODate(new Date()), now())),
      reopenQuestion: (id: ID) => store.update((d) => sections.reopenQuestion(d, id, now())),
      deleteQuestion: (id: ID) => store.update((d) => sections.deleteQuestion(d, id)),
    }),
    [store],
  );
}
