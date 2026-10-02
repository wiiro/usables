import { describe, expect, it } from 'vitest';
import type { Subtask, TaskStatus } from '../types/work';
import { projectProgress, subjectProgress, taskProgress, toPercent } from './progress';

const subtasks = (...done: boolean[]): Subtask[] =>
  done.map((isDone, index) => ({ id: `s${index}`, title: `Subtarefa ${index}`, done: isDone }));

const task = (status: TaskStatus, items: Subtask[] = []) => ({ status, subtasks: items });

describe('taskProgress', () => {
  it('sem subtarefas: 0 enquanto não está Feito', () => {
    expect(taskProgress(task('todo'))).toBe(0);
    expect(taskProgress(task('doing'))).toBe(0);
    expect(taskProgress(task('blocked'))).toBe(0);
  });

  it('sem subtarefas: 1 quando está Feito', () => {
    expect(taskProgress(task('done'))).toBe(1);
  });

  it('com subtarefas: concluídas ÷ total', () => {
    expect(taskProgress(task('doing', subtasks(true, false, false, true)))).toBe(0.5);
  });

  it('com subtarefas: o status não interfere, nem quando é Feito', () => {
    expect(taskProgress(task('done', subtasks(true, false)))).toBe(0.5);
    expect(taskProgress(task('todo', subtasks(true, true)))).toBe(1);
  });
});

describe('projectProgress', () => {
  it('é null quando o projeto não tem tarefas', () => {
    expect(projectProgress([])).toBeNull();
  });

  it('é a média do progresso das tarefas', () => {
    const tasks = [task('done'), task('todo'), task('doing', subtasks(true, false))];
    expect(projectProgress(tasks)).toBeCloseTo((1 + 0 + 0.5) / 3);
  });
});

describe('subjectProgress', () => {
  it('é null quando a matéria não tem tópicos', () => {
    expect(subjectProgress([])).toBeNull();
  });

  it('é tópicos concluídos ÷ total', () => {
    const topics = [{ status: 'done' }, { status: 'studying' }, { status: 'not_started' }, { status: 'done' }] as const;
    expect(subjectProgress(topics)).toBe(0.5);
  });
});

describe('toPercent', () => {
  it('arredonda para o inteiro mais próximo', () => {
    expect(toPercent(2 / 3)).toBe(67);
    expect(toPercent(0)).toBe(0);
    expect(toPercent(1)).toBe(100);
  });
});
