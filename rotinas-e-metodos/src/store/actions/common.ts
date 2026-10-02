import type { ID, ISODateTime, OwnerRef, OwnerType } from '../../types/common';
import type { AppState } from '../../types/state';

// As ações são funções puras que alteram o rascunho recebido de store.update.
// Id e horário chegam de fora (useWorkActions), para os testes serem previsíveis.

export interface CreateMeta {
  id: ID;
  now: ISODateTime;
}

/** Item pelo id; lança erro se não existir (ex.: excluído em outra aba). */
export function findById<T extends { id: ID }>(items: T[], id: ID, what: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`${what} não encontrado: ${id}`);
  return item;
}

/** Remove ideias, bloqueios, avanços e dúvidas que pertencem aos itens indicados. */
export function removeSectionsOf(draft: AppState, ownerType: OwnerType, ownerIds: ReadonlySet<ID>): void {
  const keep = (item: OwnerRef) => !(item.ownerType === ownerType && ownerIds.has(item.ownerId));
  draft.ideas = draft.ideas.filter(keep);
  draft.blockers = draft.blockers.filter(keep);
  draft.progressLogs = draft.progressLogs.filter(keep);
  draft.questions = draft.questions.filter(keep);
}
