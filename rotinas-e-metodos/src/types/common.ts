/** Identificador único, gerado com crypto.randomUUID(). */
export type ID = string;

/** Dia de calendário no formato 'AAAA-MM-DD', sem fuso horário. */
export type ISODate = string;

/** Data e hora completas em ISO 8601 (UTC), usadas como carimbo de criação/edição. */
export type ISODateTime = string;

export interface BaseEntity {
  id: ID;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** 0 = domingo … 6 = sábado (mesma convenção de Date.getDay()). */
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/**
 * Regra de repetição de uma tarefa ou tópico. A série começa na data do item
 * (dueDate / plannedDate), que passa a ser obrigatória quando há recorrência.
 * Mensal: mesmo dia do mês da data inicial; em meses mais curtos, o último dia.
 */
export type Recurrence =
  | { freq: 'daily' }
  | { freq: 'weekly'; weekdays: Weekday[] }
  | { freq: 'monthly' };

/** A quem pertence uma ideia, bloqueio, avanço ou dúvida. */
export const OWNER_TYPES = ['project', 'task', 'topic'] as const;
export type OwnerType = (typeof OWNER_TYPES)[number];

export interface OwnerRef {
  ownerType: OwnerType;
  ownerId: ID;
}
