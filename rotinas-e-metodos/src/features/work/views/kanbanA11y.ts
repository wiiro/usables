import type { Announcements, ScreenReaderInstructions, UniqueIdentifier } from '@dnd-kit/core';
import { TASK_STATUS_LABELS } from '../../../domain/labels';
import type { TaskStatus } from '../../../types/work';

// Textos lidos pelo leitor de tela durante o arraste (o padrão do dnd-kit é em inglês).

export const KANBAN_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    'Para mover a tarefa, tecle Espaço. Use as setas para trocar de posição ou de coluna e Espaço para soltar. ' +
    'Esc cancela. Enter abre os detalhes.',
};

export function kanbanAnnouncements(
  titleOf: (id: UniqueIdentifier) => string,
  columnOf: (id: string) => TaskStatus | null,
): Announcements {
  const where = (id: UniqueIdentifier) => {
    const status = columnOf(String(id));
    return status ? `na coluna ${TASK_STATUS_LABELS[status]}` : 'fora das colunas';
  };

  return {
    onDragStart: ({ active }) => `Tarefa "${titleOf(active.id)}" selecionada para mover.`,
    onDragOver: ({ active, over }) => `Tarefa "${titleOf(active.id)}" ${over ? where(over.id) : 'fora das colunas'}.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Tarefa "${titleOf(active.id)}" solta ${where(over.id)}.`
        : `Tarefa "${titleOf(active.id)}" solta fora das colunas; nada mudou.`,
    onDragCancel: ({ active }) => `Movimento cancelado. A tarefa "${titleOf(active.id)}" voltou ao lugar.`,
  };
}
