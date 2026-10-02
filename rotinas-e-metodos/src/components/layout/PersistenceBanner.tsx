import { TriangleAlert, X } from 'lucide-react';
import { useStore, usePersistenceIssue } from '../../store/StoreContext';
import type { PersistenceIssue } from '../../store/store';

// Avisos de gravação. No Template, uma falha ao salvar era silenciosa; aqui
// ela aparece na hora, para nada se perder sem você saber.

function describe(issue: PersistenceIssue): { title: string; body: string } {
  switch (issue.kind) {
    case 'save-failed':
      return { title: 'Não foi possível salvar a última alteração.', body: issue.message };
    case 'read-only':
      return { title: 'Salvamento desligado: nada do que você fizer agora será guardado.', body: issue.message };
    case 'recovered':
      return {
        title: 'Os dados salvos estavam ilegíveis e o app começou do zero.',
        body: `O conteúdo antigo não foi apagado: está guardado no armazenamento do navegador, na chave "${issue.recoveryKey}".`,
      };
  }
}

export function PersistenceBanner() {
  const store = useStore();
  const issue = usePersistenceIssue();
  if (!issue) return null;

  const { title, body } = describe(issue);
  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-amber-300 bg-amber-50 px-6 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 opacity-90">{body}</p>
      </div>
      {issue.kind === 'recovered' && (
        <button
          type="button"
          onClick={() => store.dismissIssue()}
          className="rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-900/60"
          aria-label="Fechar aviso"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
