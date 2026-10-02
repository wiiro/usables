import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { useMemo, useRef, useState } from 'react';
import type { Columns, DropResult } from '../../../domain/kanban';
import { buildColumns, findColumn, moveAcross, settleDrop } from '../../../domain/kanban';
import type { ID } from '../../../types/common';
import type { Task } from '../../../types/work';

interface DragState {
  activeId: ID;
  /** Cópia das colunas enquanto arrasta; o estado só muda ao soltar. */
  preview: Columns;
}

/**
 * Liga o dnd-kit às regras de domain/kanban.ts. O estado do arraste fica em
 * state (para redesenhar) e num ref (para os handlers lerem sempre o valor
 * mais recente, mesmo que o dnd-kit chame um handler de um render anterior).
 */
export function useKanbanDrag(tasks: readonly Task[], onDrop: (taskId: ID, result: DropResult) => void) {
  const original = useMemo(() => buildColumns(tasks), [tasks]);
  const [drag, setDragState] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const setDrag = (next: DragState | null) => {
    dragRef.current = next;
    setDragState(next);
  };

  return {
    columns: drag?.preview ?? original,
    activeId: drag?.activeId ?? null,
    /** Coluna atual de um cartão ou alvo, considerando o arraste em andamento. */
    columnOf: (id: string) => findColumn(dragRef.current?.preview ?? original, id),

    onDragStart: ({ active }: DragStartEvent) => setDrag({ activeId: String(active.id), preview: original }),

    onDragOver: ({ active, over }: DragOverEvent) => {
      const current = dragRef.current;
      if (!current || !over) return;
      const preview = moveAcross(current.preview, String(active.id), String(over.id));
      if (preview !== current.preview) setDrag({ ...current, preview });
    },

    onDragEnd: ({ active, over }: DragEndEvent) => {
      const current = dragRef.current;
      setDrag(null);
      if (!current || !over) return;
      const result = settleDrop(original, current.preview, String(active.id), String(over.id));
      if (result) onDrop(String(active.id), result);
    },

    onDragCancel: () => setDrag(null),
  };
}
