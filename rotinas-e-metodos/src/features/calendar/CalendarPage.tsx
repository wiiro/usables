import { Briefcase, GraduationCap, Layers } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Segmented } from '../../components/ui/Segmented';
import { usePreferenceActions } from '../../store/actions/usePreferenceActions';
import { useAppState } from '../../store/StoreContext';
import { StudyTabs } from '../study/components/StudyTabs';
import { WorkTabs } from '../work/components/WorkTabs';
import { CalendarView } from './CalendarView';

const AREA_OPTIONS = [
  { value: 'all', label: 'Tudo', icon: Layers },
  { value: 'work', label: 'Trabalho', icon: Briefcase },
  { value: 'study', label: 'Estudos', icon: GraduationCap },
] as const;

const HELP = 'Clique num dia para criar um item; arraste um item para mudar a data. Itens recorrentes mudam pelo painel.';

/** /calendario: Trabalho e Estudos juntos, com filtro por área (a escolha fica salva). */
export function CalendarPage() {
  const { preferences } = useAppState();
  const { setCalendarArea } = usePreferenceActions();

  return (
    <>
      <PageHeader
        title="Calendário"
        description={HELP}
        actions={<Segmented label="Mostrar" options={AREA_OPTIONS} value={preferences.calendarArea} onChange={setCalendarArea} />}
      />
      <div className="p-6 md:p-8">
        <CalendarView area={preferences.calendarArea} />
      </div>
    </>
  );
}

/** /trabalho/calendario: só as tarefas. */
export function WorkCalendarPage() {
  return (
    <>
      <PageHeader title="Trabalho" description={HELP}>
        <WorkTabs />
      </PageHeader>
      <div className="p-6 md:p-8">
        <CalendarView area="work" />
      </div>
    </>
  );
}

/** /estudos/calendario: só os tópicos de estudo. */
export function StudyCalendarPage() {
  return (
    <>
      <PageHeader title="Estudos" description={HELP}>
        <StudyTabs />
      </PageHeader>
      <div className="p-6 md:p-8">
        <CalendarView area="study" />
      </div>
    </>
  );
}
