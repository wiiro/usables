import { Eye, Pencil } from 'lucide-react';
import { useState } from 'react';
import { TextArea } from '../ui/form';
import { Segmented } from '../ui/Segmented';
import { MarkdownView } from './MarkdownView';
import { EmptyHint } from './SectionParts';

const MODES = [
  { value: 'write', label: 'Escrever', icon: Pencil },
  { value: 'preview', label: 'Visualizar', icon: Eye },
] as const;

type Mode = (typeof MODES)[number]['value'];

interface NotesSectionProps {
  value: string;
  /** Chamado a cada tecla: as anotações são salvas enquanto você escreve. */
  onChange: (value: string) => void;
}

/** "Anotações": um texto livre em Markdown, com modo de escrita e de leitura. */
export function NotesSection({ value, onChange }: NotesSectionProps) {
  const [mode, setMode] = useState<Mode>(() => (value.trim() ? 'preview' : 'write'));

  return (
    <section aria-label="Anotações" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented label="Modo das anotações" options={MODES} value={mode} onChange={setMode} />
        <span className="text-xs text-fg-muted">Markdown · salvo automaticamente</span>
      </div>

      {mode === 'write' && (
        <>
          <TextArea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={16}
            autoFocus
            aria-label="Anotações em Markdown"
            placeholder={'# Contexto\n\n- Ponto importante\n- [ ] Algo a verificar'}
            className="font-mono leading-relaxed"
          />
          <p className="text-xs text-fg-muted">
            Dica: <code># Título</code>, <code>**negrito**</code>, <code>_itálico_</code>, <code>- lista</code>,{' '}
            <code>- [ ] tarefa</code>, <code>`código`</code>, <code>[link](https://…)</code>.
          </p>
        </>
      )}

      {mode === 'preview' &&
        (value.trim() ? (
          // Duplo clique no texto volta para a edição.
          <div onDoubleClick={() => setMode('write')} title="Duplo clique para editar">
            <MarkdownView source={value} className="rounded-xl border border-line bg-surface p-5" />
          </div>
        ) : (
          <EmptyHint>
            Nada escrito ainda.{' '}
            <button type="button" onClick={() => setMode('write')} className="font-medium text-accent underline">
              Começar a escrever
            </button>
          </EmptyHint>
        ))}
    </section>
  );
}
