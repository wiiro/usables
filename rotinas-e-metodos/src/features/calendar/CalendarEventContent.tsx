import type { EventDisplayInfo } from '@fullcalendar/react';
import { Briefcase, GraduationCap, Repeat } from 'lucide-react';
import type { CalendarEventData } from '../../domain/calendarEvents';

/** Conteúdo de um evento: ícone da área (Trabalho/Estudos), título e marca de repetição. */
export function CalendarEventContent({ info }: { info: EventDisplayInfo }) {
  const data = info.event.extendedProps as unknown as CalendarEventData;
  const AreaIcon = data.kind === 'task' ? Briefcase : GraduationCap;

  return (
    <span className="flex min-w-0 items-center gap-1 px-1 py-px text-xs font-medium">
      <AreaIcon className="size-3 shrink-0 opacity-80" aria-label={data.kind === 'task' ? 'Trabalho' : 'Estudos'} />
      <span className="truncate">{info.event.title}</span>
      {data.recurring && <Repeat className="size-3 shrink-0 opacity-80" aria-label="Repete" />}
    </span>
  );
}
