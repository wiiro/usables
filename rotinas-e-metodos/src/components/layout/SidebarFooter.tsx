import { DatabaseBackup, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { BackupDrawer } from '../../features/backup/BackupDrawer';
import { usePreferenceActions } from '../../store/actions/usePreferenceActions';
import { useAppState } from '../../store/StoreContext';

const buttonClass =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-accent';

/** Pé da barra lateral: backup e troca de tema. */
export function SidebarFooter() {
  const { theme } = useAppState();
  const { setTheme } = usePreferenceActions();
  const [backupOpen, setBackupOpen] = useState(false);
  const next = theme === 'dark' ? 'light' : 'dark';
  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const themeLabel = theme === 'dark' ? 'Tema claro' : 'Tema escuro';

  return (
    <div className="mt-auto flex flex-col gap-1 border-t border-line px-2 py-3 md:px-3">
      <button type="button" onClick={() => setBackupOpen(true)} className={buttonClass} title="Backup dos dados">
        <DatabaseBackup className="size-5 shrink-0" aria-hidden />
        <span className="sr-only md:not-sr-only">Backup</span>
      </button>
      <button type="button" onClick={() => setTheme(next)} className={buttonClass} title={themeLabel}>
        <ThemeIcon className="size-5 shrink-0" aria-hidden />
        <span className="sr-only md:not-sr-only">{themeLabel}</span>
      </button>
      <p className="hidden px-3 pt-2 text-xs text-fg-muted md:block">Dados salvos neste navegador, a cada alteração.</p>
      {backupOpen && <BackupDrawer onClose={() => setBackupOpen(false)} />}
    </div>
  );
}
