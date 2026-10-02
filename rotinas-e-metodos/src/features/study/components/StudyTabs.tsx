import { RouteTabs } from '../../../components/ui/RouteTabs';

const TABS = [
  { to: '/estudos', label: 'Matérias', end: true },
  { to: '/estudos/calendario', label: 'Calendário' },
];

/** Abas da área de Estudos, logo abaixo do título. */
export function StudyTabs() {
  return <RouteTabs label="Seções de Estudos" tabs={TABS} />;
}
