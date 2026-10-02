import type { LucideIcon } from 'lucide-react';
import { Briefcase, CalendarDays, GraduationCap, ListChecks, Sun } from 'lucide-react';
import { NavLink } from 'react-router';
import { SidebarFooter } from './SidebarFooter';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Cor da área (Trabalho / Estudos), mostrada num ponto ao lado do nome. */
  areaColor?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Hoje', icon: Sun },
  { to: '/trabalho', label: 'Trabalho', icon: Briefcase, areaColor: 'bg-work' },
  { to: '/estudos', label: 'Estudos', icon: GraduationCap, areaColor: 'bg-study' },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    isActive ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:bg-surface-muted hover:text-fg',
  ].join(' ');

export function Sidebar() {
  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-line bg-surface md:w-60">
      <div className="flex h-16 items-center gap-3 px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg">
          <ListChecks className="size-5" aria-hidden />
        </span>
        <span className="hidden text-base font-semibold tracking-tight md:inline">Rotinas e Métodos</span>
      </div>

      <nav aria-label="Áreas" className="flex flex-col gap-1 px-2 py-2 md:px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, areaColor }) => (
          <NavLink key={to} to={to} end={to === '/'} className={linkClass} title={label}>
            <Icon className="size-5 shrink-0" aria-hidden />
            {/* sr-only na tela estreita: a barra mostra só o ícone, mas o nome continua acessível */}
            <span className="sr-only flex-1 md:not-sr-only">{label}</span>
            {areaColor && <span className={`hidden size-2 rounded-full md:inline ${areaColor}`} aria-hidden />}
          </NavLink>
        ))}
      </nav>

      <SidebarFooter />
    </aside>
  );
}
