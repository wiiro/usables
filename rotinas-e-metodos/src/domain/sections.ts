import type { OwnerRef } from '../types/common';
import type { Blocker, Idea, ProgressLog, Question } from '../types/sections';

// Consultas e ordem de exibição das seções (ideias, bloqueios, avanços).

/** Itens de uma seção que pertencem a um projeto, tarefa ou tópico. */
export function itemsOf<T extends OwnerRef>(items: readonly T[], owner: OwnerRef): T[] {
  return items.filter((item) => item.ownerType === owner.ownerType && item.ownerId === owner.ownerId);
}

const newestFirst = (a: string, b: string) => b.localeCompare(a);

/** Mais recentes primeiro (pela data da ideia; empate pela criação). */
export function sortIdeas(ideas: readonly Idea[]): Idea[] {
  return [...ideas].sort((a, b) => newestFirst(a.date, b.date) || newestFirst(a.createdAt, b.createdAt));
}

/** Ativos primeiro (mais novo no topo); depois os resolvidos, do resolvido mais recente ao mais antigo. */
export function sortBlockers(blockers: readonly Blocker[]): Blocker[] {
  return [...blockers].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    if (a.status === 'resolved') return newestFirst(a.resolvedOn ?? '', b.resolvedOn ?? '') || newestFirst(a.createdAt, b.createdAt);
    return newestFirst(a.createdAt, b.createdAt);
  });
}

/** Diário: dia mais recente primeiro; no mesmo dia, o último registro no topo. */
export function sortProgressLogs(logs: readonly ProgressLog[]): ProgressLog[] {
  return [...logs].sort((a, b) => newestFirst(a.date, b.date) || newestFirst(a.createdAt, b.createdAt));
}

export function countActiveBlockers(blockers: readonly Blocker[]): number {
  return blockers.filter((blocker) => blocker.status === 'active').length;
}

/** Em aberto primeiro (mais nova no topo); depois as respondidas, da resposta mais recente à mais antiga. */
export function sortQuestions(questions: readonly Question[]): Question[] {
  return [...questions].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
    if (a.status === 'answered') return newestFirst(a.answeredOn ?? '', b.answeredOn ?? '') || newestFirst(a.createdAt, b.createdAt);
    return newestFirst(a.createdAt, b.createdAt);
  });
}

export function countOpenQuestions(questions: readonly Question[]): number {
  return questions.filter((question) => question.status === 'open').length;
}
