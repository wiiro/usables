import { Download, Upload } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { MAX_BACKUP_BYTES, backupFileName, createBackup, parseBackup, storageShare, summarizeState } from '../../store/backup';
import { useAppState, useStore } from '../../store/StoreContext';
import type { AppState } from '../../types/state';
import { downloadJson } from './downloadJson';

type ImportStep =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; fileName: string; state: AppState }
  | { kind: 'done'; summary: string };

/** Exportar todos os dados em JSON e importar de volta (substitui tudo, depois de confirmar). */
export function BackupDrawer({ onClose }: { onClose: () => void }) {
  const state = useAppState();
  const store = useStore();
  const [step, setStep] = useState<ImportStep>({ kind: 'idle' });
  const share = storageShare(state);

  const exportNow = () => downloadJson(backupFileName(new Date()), createBackup(store.getState(), new Date()));

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) return setStep({ kind: 'error', message: 'O arquivo passa de 10 MB; não parece um backup deste app.' });
    const result = parseBackup(await file.text());
    setStep(result.ok ? { kind: 'ready', fileName: file.name, state: result.state } : { kind: 'error', message: result.message });
  };

  const confirmImport = (imported: AppState) => {
    exportNow(); // decisão do projeto: antes de substituir, baixa um backup do que existe hoje
    store.update((draft) => Object.assign(draft, structuredClone(imported)));
    setStep({ kind: 'done', summary: summarizeState(imported) });
  };

  return (
    <Drawer title="Backup dos dados" onClose={onClose} footer={<Button onClick={onClose}>Fechar</Button>}>
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Exportar</h3>
          <p className="text-sm text-fg-muted">
            Baixa um arquivo .json com tudo: {summarizeState(state)}. Guarde-o fora do navegador (o OneDrive, por exemplo).
          </p>
          <div>
            <Button variant="primary" onClick={exportNow}>
              <Download className="size-4" aria-hidden />
              Exportar backup
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Importar</h3>
          <p className="text-sm text-fg-muted">
            Substitui <strong>todos</strong> os dados atuais pelos do arquivo. Antes de substituir, o app baixa automaticamente um backup do que existe hoje.
          </p>
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium hover:bg-surface-muted focus-within:outline-2 focus-within:outline-accent">
            <Upload className="size-4" aria-hidden />
            Escolher arquivo…
            <input type="file" accept="application/json,.json" onChange={onFile} className="sr-only" />
          </label>
          <ImportStatus step={step} onConfirm={confirmImport} onCancel={() => setStep({ kind: 'idle' })} />
        </section>

        <section className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">Espaço usado</h3>
          <p className="text-sm text-fg-muted">
            {share < 0.001 ? 'Menos de 0,1%' : `${(share * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`} do espaço que o navegador reserva para o
            app (cerca de 5 milhões de caracteres).
          </p>
        </section>
      </div>
    </Drawer>
  );
}

interface ImportStatusProps {
  step: ImportStep;
  onConfirm: (state: AppState) => void;
  onCancel: () => void;
}

function ImportStatus({ step, onConfirm, onCancel }: ImportStatusProps) {
  if (step.kind === 'idle') return null;
  if (step.kind === 'error') {
    return <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">{step.message}</p>;
  }
  if (step.kind === 'done') {
    return <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">Importado: {step.summary}.</p>;
  }
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <p>
        <strong>{step.fileName}</strong> contém {summarizeState(step.state)}. Substituir todos os dados atuais por estes?
      </p>
      <div className="flex gap-2">
        <Button variant="danger" onClick={() => onConfirm(step.state)}>
          Substituir tudo
        </Button>
        <Button onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
}
