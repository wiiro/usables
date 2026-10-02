import { RouteTabs } from '../../../components/ui/RouteTabs';

const TABS = [
  { to: '/trabalho', label: 'Projetos', end: true },
  { to: '/trabalho/tarefas', label: 'Tarefas' },
  { to: '/trabalho/calendario', label: 'Calendário' },
];

/** Abas da área de Trabalho, logo abaixo do título. */
export function WorkTabs() {
  return <RouteTabs label="Seções de Trabalho" tabs={TABS} />;
}
