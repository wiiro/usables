import FullCalendar from '@fullcalendar/react';
import type { DateClickInfo, DatesSetInfo, EventClickInfo, EventDisplayInfo, EventDropInfo } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import interactionPlugin from '@fullcalendar/react/interaction';
import ptBrLocale from '@fullcalendar/react/locales/pt-br';
import classicTheme from '@fullcalendar/react/themes/classic';
import rrulePlugin from '@fullcalendar/rrule';
import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';
import { useMemo, useState } from 'react';
import type { CalendarEventData } from '../../domain/calendarEvents';
import { buildCalendarEvents } from '../../domain/calendarEvents';
import { toISODate } from '../../domain/dates';
import { useItemDrawer } from '../../hooks/useItemDrawer';
import { usePreferenceActions } from '../../store/actions/usePreferenceActions';
import { useStudyActions } from '../../store/actions/useStudyActions';
import { useWorkActions } from '../../store/actions/useWorkActions';
import { useAppState } from '../../store/StoreContext';
import type { ISODate } from '../../types/common';
import type { CalendarArea, CalendarView as CalendarViewName } from '../../types/state';
import { TopicDrawerHost } from '../study/components/TopicDrawer';
import { TaskDrawerHost } from '../work/components/TaskDrawerHost';
import { CalendarEventContent } from './CalendarEventContent';
import { CreateOnDateDialog } from './CreateOnDateDialog';

const PLUGINS = [dayGridPlugin, interactionPlugin, rrulePlugin, classicTheme];
const VIEW_TYPES: Record<CalendarViewName, string> = { month: 'dayGridMonth', week: 'dayGridWeek', day: 'dayGridDay' };
const TOOLBAR = { start: 'prev,next today', center: 'title', end: 'dayGridMonth,dayGridWeek,dayGridDay' };
// O mês cresce conforme o conteúdo; semana e dia têm uma linha só, então ganham altura fixa.
const heightFor = (view: CalendarViewName) => (view === 'month' ? 'auto' : 560);

const dataOf = (event: { extendedProps: Record<string, unknown> }) => event.extendedProps as unknown as CalendarEventData;

/** Calendário de dia, semana e mês. `area` decide o que aparece: tudo, Trabalho ou Estudos. */
export function CalendarView({ area }: { area: CalendarArea }) {
  const state = useAppState();
  const { setTaskDueDate } = useWorkActions();
  const { setTopicPlannedDate } = useStudyActions();
  const { setCalendarView } = usePreferenceActions();
  const taskDrawer = useItemDrawer('tarefa');
  const topicDrawer = useItemDrawer('topico');
  const [creatingOn, setCreatingOn] = useState<ISODate | null>(null);
  const { tasks, topics, projects, subjects } = state;
  // Recalcula só quando os itens mudam (não a cada preferência salva).
  const events = useMemo(
    () => buildCalendarEvents({ tasks, topics, projects, subjects }, area),
    [tasks, topics, projects, subjects, area],
  );

  const onEventClick = ({ event }: EventClickInfo) => {
    const data = dataOf(event);
    const occurrence = data.recurring && event.start ? toISODate(event.start) : null;
    if (data.kind === 'task') taskDrawer.open(data.itemId, occurrence);
    else topicDrawer.open(data.itemId, occurrence);
  };

  const onEventDrop = ({ event, revert }: EventDropInfo) => {
    const data = dataOf(event);
    if (!event.start || data.recurring) return revert();
    try {
      if (data.kind === 'task') setTaskDueDate(data.itemId, toISODate(event.start));
      else setTopicPlannedDate(data.itemId, toISODate(event.start));
    } catch (error) {
      // Item excluído em outra aba, por exemplo: volta o evento para onde estava.
      console.error('[Rotinas e Métodos] não foi possível mudar a data', error);
      revert();
    }
  };

  const onDatesSet = ({ view }: DatesSetInfo) => {
    const chosen = (Object.keys(VIEW_TYPES) as CalendarViewName[]).find((key) => VIEW_TYPES[key] === view.type);
    if (chosen && chosen !== state.preferences.calendarView) setCalendarView(chosen);
  };

  // Painéis e o formulário de criação ficam fora de .app-calendar: as regras
  // de estilo do calendário (index.css) não devem alcançá-los.
  return (
    <>
      <div className="app-calendar rounded-xl border border-line bg-surface p-3" data-color-scheme={state.theme}>
        <FullCalendar
        plugins={PLUGINS}
        locale={ptBrLocale}
        initialView={VIEW_TYPES[state.preferences.calendarView]}
        headerToolbar={TOOLBAR}
        height={heightFor(state.preferences.calendarView)}
        dayMaxEvents={4}
        events={events}
        eventClick={onEventClick}
        eventDrop={onEventDrop}
        dateClick={({ dateStr }: DateClickInfo) => setCreatingOn(dateStr.slice(0, 10))}
        datesSet={onDatesSet}
        eventClass={eventClass}
        eventContent={(info: EventDisplayInfo) => <CalendarEventContent info={info} />}
        />
      </div>
      <TaskDrawerHost />
      <TopicDrawerHost />
      {creatingOn && <CreateOnDateDialog date={creatingOn} area={area} onClose={() => setCreatingOn(null)} />}
    </>
  );
}

/** Esmaece o que já foi feito: o item inteiro (status) ou só a ocorrência marcada. */
function eventClass({ event }: EventDisplayInfo): string {
  const data = dataOf(event);
  const day = event.start ? toISODate(event.start) : '';
  const done = data.done || data.completedOccurrences.includes(day);
  return ['cal-event', `cal-${data.kind}`, done ? 'cal-done' : ''].join(' ');
}
