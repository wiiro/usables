import { Columns3, List, X } from 'lucide-react';
import { Segmented } from '../../../components/ui/Segmented';
import { DUE_FILTER_LABELS, PRIORITY_LABELS, STATUS_FILTER_LABELS, projectName } from '../../../domain/labels';
import type { TaskFilters } from '../../../domain/taskFilters';
import { DUE_FILTERS, STATUS_FILTERS, hasActiveFilters } from '../../../domain/taskFilters';
import type { TaskView } from '../../../types/state';
import type { Project } from '../../../types/work';
import { PRIORITIES } from '../../../types/work';

interface TaskToolbarProps {
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  filters: TaskFilters;
  onFilterChange: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  onClear: () => void;
  /** null na página de um projeto: o filtro de projeto não aparece. */
  projects: Project[] | null;
  tags: string[];
  shown: number;
  total: number;
}

export function TaskToolbar(props: TaskToolbarProps) {
  const { view, onViewChange, filters, onFilterChange, onClear, projects, tags, shown, total } = props;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ViewToggle view={view} onChange={onViewChange} />
      <span className="mx-1 h-6 w-px bg-line" aria-hidden />
      {projects && (
        <FilterSelect
          label="Filtrar por projeto"
          allLabel="Todos os projetos"
          value={filters.projectId}
          options={projects.map((p) => ({ value: p.id, label: projectName(p) }))}
          onChange={(v) => onFilterChange('projectId', v)}
        />
      )}
      {/* No Kanban as colunas já são os status. */}
      {view === 'list' && (
        <FilterSelect
          label="Filtrar por status"
          allLabel="Todos os status"
          value={filters.status}
          options={STATUS_FILTERS.map((s) => ({ value: s, label: STATUS_FILTER_LABELS[s] }))}
          onChange={(v) => onFilterChange('status', v)}
        />
      )}
      <FilterSelect
        label="Filtrar por prioridade"
        allLabel="Todas as prioridades"
        value={filters.priority}
        options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] }))}
        onChange={(v) => onFilterChange('priority', v)}
      />
      <FilterSelect
        label="Filtrar por prazo"
        allLabel="Qualquer prazo"
        value={filters.due}
        options={DUE_FILTERS.map((d) => ({ value: d, label: DUE_FILTER_LABELS[d] }))}
        onChange={(v) => onFilterChange('due', v)}
      />
      {tags.length > 0 && (
        <FilterSelect
          label="Filtrar por etiqueta"
          allLabel="Todas as etiquetas"
          value={filters.tag}
          options={tags.map((t) => ({ value: t, label: t }))}
          onChange={(v) => onFilterChange('tag', v)}
        />
      )}
      {hasActiveFilters(filters) && (
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-fg-muted hover:bg-surface-muted hover:text-fg">
          <X className="size-3.5" aria-hidden />
          Limpar filtros
        </button>
      )}
      <span className="ml-auto text-xs text-fg-muted" aria-live="polite">
        {shown === total ? `${total} ${total === 1 ? 'tarefa' : 'tarefas'}` : `${shown} de ${total} tarefas`}
      </span>
    </div>
  );
}

const VIEW_OPTIONS = [
  { value: 'kanban', label: 'Kanban', icon: Columns3 },
  { value: 'list', label: 'Lista', icon: List },
] as const;

function ViewToggle({ view, onChange }: { view: TaskView; onChange: (view: TaskView) => void }) {
  return <Segmented label="Visualização" options={VIEW_OPTIONS} value={view} onChange={onChange} />;
}

interface FilterSelectProps<T extends string> {
  label: string;
  allLabel: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T | null) => void;
}

function FilterSelect<T extends string>({ label, allLabel, value, options, onChange }: FilterSelectProps<T>) {
  return (
    <select
      aria-label={label}
      value={value ?? ''}
      onChange={(event) => onChange(options.find((option) => option.value === event.target.value)?.value ?? null)}
      className={[
        'h-8 max-w-48 rounded-lg border bg-surface px-2 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30',
        value ? 'border-accent font-medium text-accent' : 'border-line text-fg-muted',
      ].join(' ')}
    >
      <option value="">{allLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
