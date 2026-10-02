import type { AppState, BackupFile } from '../types/state';
import { appStateSchema } from './stateSchema';

// Exportar e importar o estado inteiro como JSON. Importar substitui tudo,
// então o arquivo passa por três filtros antes: JSON válido, formato válido
// (mesmo schema do carregamento) e vínculos íntegros (nada apontando para
// item que não existe).

/** Arquivos maiores que isso não são lidos (o localStorage nem comportaria). */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export function createBackup(state: AppState, now: Date): BackupFile {
  return { app: 'rotinas-e-metodos', exportedAt: now.toISOString(), state };
}

export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `rotinas-e-metodos-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

export type ParseBackupResult = { ok: true; state: AppState } | { ok: false; message: string };

/** Aceita o arquivo exportado pelo app ou o JSON do estado puro (o que aparece no F5 do README). */
export function parseBackup(text: string): ParseBackupResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, message: 'O arquivo não é um JSON válido.' };
  }

  const wrapped = typeof json === 'object' && json !== null && 'state' in json;
  if (wrapped && (json as { app?: unknown }).app !== 'rotinas-e-metodos') {
    return { ok: false, message: 'Este arquivo não é um backup do Rotinas e Métodos.' };
  }
  const result = appStateSchema.safeParse(wrapped ? (json as { state: unknown }).state : json);
  if (!result.success) {
    const where = result.error.issues.slice(0, 3).map((issue) => issue.path.join('.') || '(raiz)');
    return { ok: false, message: `O arquivo não tem o formato esperado (campos: ${where.join(', ')}).` };
  }

  const problems = findIntegrityProblems(result.data);
  if (problems.length > 0) {
    return { ok: false, message: `O arquivo tem vínculos quebrados: ${problems.slice(0, 3).join('; ')}.` };
  }
  return { ok: true, state: result.data };
}

/** Vínculos quebrados e ids repetidos; lista vazia = arquivo íntegro. */
export function findIntegrityProblems(state: AppState): string[] {
  const problems: string[] = [];
  const ids = {
    project: new Set(state.projects.map((p) => p.id)),
    task: new Set(state.tasks.map((t) => t.id)),
    subject: new Set(state.subjects.map((s) => s.id)),
    topic: new Set(state.topics.map((t) => t.id)),
  };

  const collections = { projects: state.projects, tasks: state.tasks, subjects: state.subjects, topics: state.topics, ideas: state.ideas, blockers: state.blockers, progressLogs: state.progressLogs, questions: state.questions };
  for (const [name, items] of Object.entries(collections)) {
    if (new Set(items.map((item) => item.id)).size !== items.length) problems.push(`ids repetidos em ${name}`);
  }
  for (const task of state.tasks) if (!ids.project.has(task.projectId)) problems.push(`tarefa ${task.id} sem projeto`);
  for (const topic of state.topics) if (!ids.subject.has(topic.subjectId)) problems.push(`tópico ${topic.id} sem matéria`);

  const owners = [...state.ideas, ...state.blockers, ...state.progressLogs, ...state.questions];
  for (const item of owners) {
    if (!ids[item.ownerType].has(item.ownerId)) problems.push(`item ${item.id} ligado a ${item.ownerType} inexistente`);
  }
  return problems;
}

/** Resumo para a pergunta de confirmação: "2 projetos, 7 tarefas, …". */
export function summarizeState(state: AppState): string {
  const parts: [number, string, string][] = [
    [state.projects.length, 'projeto', 'projetos'],
    [state.tasks.length, 'tarefa', 'tarefas'],
    [state.subjects.length, 'matéria', 'matérias'],
    [state.topics.length, 'tópico', 'tópicos'],
    [state.ideas.length + state.blockers.length + state.progressLogs.length + state.questions.length, 'registro de seção', 'registros de seções'],
  ];
  return parts.map(([n, one, many]) => `${n} ${n === 1 ? one : many}`).join(', ');
}

/** Fração do limite do localStorage (~5 milhões de caracteres) que o estado ocupa. */
export function storageShare(state: AppState): number {
  return JSON.stringify(state).length / 5_000_000;
}
