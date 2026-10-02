import type { UniqueIdentifier } from '@dnd-kit/core';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import { taskTitle } from '../../../domain/labels';
import { useWorkActions } from '../../../store/actions/useWorkActions';
import type { Task } from '../../../types/work';
import { TASK_STATUSES } from '../../../types/work';
import { KanbanCardContent } from './KanbanCard';
import { KanbanColumn } from './KanbanColumn';
import { KANBAN_INSTRUCTIONS, kanbanAnnouncements } from './kanbanA11y';
import type { TaskDisplay } from './taskDisplay';
import { useKanbanDrag } from './useKanbanDrag';

interface KanbanBoardProps {
  tasks: Task[];
  display: TaskDisplay;
}

export function KanbanBoard({ tasks, display }: KanbanBoardProps) {
  const { moveTask } = useWorkActions();
  const drag = useKanbanDrag(tasks, moveTask);
  const byId = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  const sensors = useSensors(
    // Só vira arraste depois de 6px: um clique simples continua abrindo o painel.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Espaço pega/solta; Enter fica livre para abrir o painel.
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const titleOf = (id: UniqueIdentifier) => {
    const task = byId.get(String(id));
    return task ? taskTitle(task) : '';
  };
  const activeTask = drag.activeId ? byId.get(drag.activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={drag.onDragStart}
      onDragOver={drag.onDragOver}
      onDragEnd={drag.onDragEnd}
      onDragCancel={drag.onDragCancel}
      accessibility={{ announcements: kanbanAnnouncements(titleOf, drag.columnOf), screenReaderInstructions: KANBAN_INSTRUCTIONS }}
    >
      {/* relative: os textos só para leitor de tela (sr-only, posição absoluta) ficam presos
          nesta área rolável em vez de alargar a página inteira. */}
      <div className="relative flex gap-3 overflow-x-auto pb-2">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={drag.columns[status].flatMap((id) => byId.get(id) ?? [])}
            display={display}
          />
        ))}
      </div>
      <DragOverlay>{activeTask && <KanbanCardContent task={activeTask} display={display} lifted />}</DragOverlay>
    </DndContext>
  );
}
