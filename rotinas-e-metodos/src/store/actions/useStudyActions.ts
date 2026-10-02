import { useMemo } from 'react';
import type { ID, ISODate, Recurrence } from '../../types/common';
import { useStore } from '../StoreContext';
import type { SubjectFields, TopicPatch } from './study';
import * as study from './study';

const now = () => new Date().toISOString();
const meta = () => ({ id: crypto.randomUUID(), now: now() });

/** Ações da área de Estudos, já ligadas ao store. */
export function useStudyActions() {
  const store = useStore();

  return useMemo(
    () => ({
      createSubject(fields: SubjectFields): ID {
        const m = meta();
        store.update((d) => study.createSubject(d, fields, m));
        return m.id;
      },
      updateSubject: (id: ID, patch: Partial<SubjectFields>) => store.update((d) => study.updateSubject(d, id, patch, now())),
      deleteSubject: (id: ID) => store.update((d) => study.deleteSubject(d, id)),

      createTopic(subjectId: ID, title: string, plannedDate: ISODate | null = null): ID {
        const m = meta();
        store.update((d) => study.createTopic(d, { subjectId, title, plannedDate }, m));
        return m.id;
      },
      updateTopic: (id: ID, patch: TopicPatch) => store.update((d) => study.updateTopic(d, id, patch, now())),
      setTopicPlannedDate: (id: ID, date: ISODate | null) =>
        store.update((d) => study.setTopicPlannedDate(d, id, date, now())),
      setTopicRecurrence: (id: ID, recurrence: Recurrence | null) =>
        store.update((d) => study.setTopicRecurrence(d, id, recurrence, now())),
      setTopicOccurrenceDone: (id: ID, date: ISODate, done: boolean) =>
        store.update((d) => study.setTopicOccurrenceDone(d, id, date, done, now())),
      deleteTopic: (id: ID) => store.update((d) => study.deleteTopic(d, id)),
    }),
    [store],
  );
}
