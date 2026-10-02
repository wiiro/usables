import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlarmClock, CalendarCheck, ChartNoAxesColumn, OctagonAlert } from 'lucide-react';
import { useMemo } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { buildAgenda } from '../../domain/today';
import { useToday } from '../../hooks/useToday';
import { useAppState } from '../../store/StoreContext';
import { TopicDrawerHost } from '../study/components/TopicDrawer';
import { TaskDrawerHost } from '../work/components/TaskDrawerHost';
import { ActiveBlockers } from './ActiveBlockers';
import { AgendaList } from './AgendaList';
import { ProgressOverview } from './ProgressOverview';
import { CardEmpty, TodayCard } from './TodayCard';

/** Tela inicial: o que vence hoje, o que está atrasado, bloqueios ativos e progresso. */
export function TodayPage() {
  const { tasks, topics, projects, subjects, blockers } = useAppState();
  const today = useToday();
  const agenda = useMemo(() => buildAgenda({ tasks, topics, projects, subjects }, today), [tasks, topics, projects, subjects, today]);
  const pending = agenda.dueToday.filter((item) => !item.done).length;
  const activeBlockers = blockers.filter((b) => b.status === 'active').length;
  const label = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <>
      <PageHeader title="Hoje" description={label} />
      <div className="grid gap-5 p-6 md:p-8 xl:grid-cols-2">
        <TodayCard icon={CalendarCheck} title="Para hoje" count={pending}>
          {agenda.dueToday.length === 0 ? <CardEmpty>Nada marcado para hoje.</CardEmpty> : <AgendaList items={agenda.dueToday} today={today} />}
        </TodayCard>
        <TodayCard icon={AlarmClock} title="Atrasados" count={agenda.overdue.length} alert>
          {agenda.overdue.length === 0 ? <CardEmpty>Nada atrasado.</CardEmpty> : <AgendaList items={agenda.overdue} today={today} late />}
        </TodayCard>
        <TodayCard icon={OctagonAlert} title="Bloqueios ativos" count={activeBlockers} alert>
          <ActiveBlockers today={today} />
        </TodayCard>
        <TodayCard icon={ChartNoAxesColumn} title="Progresso">
          <ProgressOverview />
        </TodayCard>
      </div>
      <TaskDrawerHost />
      <TopicDrawerHost />
    </>
  );
}
