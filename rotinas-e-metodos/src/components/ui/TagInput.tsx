import { X } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useId, useState } from 'react';
import { addTag } from '../../domain/tags';

interface TagInputProps {
  id: string;
  tags: string[];
  /** Etiquetas já usadas em outros itens, oferecidas enquanto digita. */
  suggestions: string[];
  onChange: (tags: string[]) => void;
}

/** Digite e tecle Enter (ou vírgula) para acrescentar; Backspace no campo vazio remove a última. */
export function TagInput({ id, tags, suggestions, onChange }: TagInputProps) {
  const [draft, setDraft] = useState('');
  const listId = useId();

  const commit = () => {
    const next = addTag(tags, draft);
    if (next) onChange(next);
    setDraft('');
  };

  // A vírgula é tratada pelo texto, não pela tecla: assim colar "a, b, c"
  // também vira três etiquetas. O que vem depois da última vírgula continua no campo.
  const onDraftChange = (value: string) => {
    const parts = value.split(',');
    const rest = parts.pop() ?? '';
    const next = parts.reduce<string[]>((acc, part) => addTag(acc, part) ?? acc, tags);
    if (next !== tags) onChange(next);
    setDraft(rest);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-surface-muted py-0.5 pr-1 pl-2 text-xs">
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="rounded p-0.5 text-fg-muted hover:bg-line hover:text-fg"
            aria-label={`Remover etiqueta ${tag}`}
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        list={listId}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? 'Ex.: reunião, relatório…' : ''}
        className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none"
      />
      <datalist id={listId}>
        {suggestions
          .filter((suggestion) => !tags.includes(suggestion))
          .map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
      </datalist>
    </div>
  );
}
