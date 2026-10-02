import { NavLink } from 'react-router';
import { CountBadge } from './CountBadge';

export interface RouteTab {
  to: string;
  label: string;
  /** Ativa só no endereço exato (para a aba "raiz"). */
  end?: boolean;
  count?: number;
  alert?: boolean;
}

/** Abas que são links: cada uma tem endereço próprio, então F5 e "voltar" funcionam. */
export function RouteTabs({ label, tabs }: { label: string; tabs: readonly RouteTab[] }) {
  return (
    <nav aria-label={label} className="-mb-5 mt-4 flex gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            [
              'inline-flex items-center gap-1.5 border-b-2 px-3 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              isActive ? 'border-accent text-accent' : 'border-transparent text-fg-muted hover:text-fg',
            ].join(' ')
          }
        >
          {tab.label}
          <CountBadge count={tab.count} alert={tab.alert} />
        </NavLink>
      ))}
    </nav>
  );
}
