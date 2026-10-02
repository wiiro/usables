import { Outlet } from 'react-router';
import { useAppState } from '../../store/StoreContext';
import { PersistenceBanner } from './PersistenceBanner';
import { Sidebar } from './Sidebar';
import { useApplyTheme } from './useApplyTheme';

export function AppShell() {
  const { theme } = useAppState();
  useApplyTheme(theme);

  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <PersistenceBanner />
        <Outlet />
      </main>
    </div>
  );
}
