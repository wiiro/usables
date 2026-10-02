import { describe, expect, it } from 'vitest';
import type { Blocker, ProgressLog } from '../types/sections';
import { countActiveBlockers, countOpenQuestions, itemsOf, sortBlockers, sortProgressLogs, sortQuestions } from './sections';

const stamp = (day: string) => `2026-10-${day}T12:00:00.000Z`;

const blocker = (id: string, status: Blocker['status'], created: string, resolvedOn: string | null = null): Blocker => ({
  id, createdAt: stamp(created), updatedAt: stamp(created), ownerType: 'task', ownerId: 't1',
  description: id, status, resolvedOn,
});

const log = (id: string, date: string, created: string): ProgressLog => ({
  id, createdAt: stamp(created), updatedAt: stamp(created), ownerType: 'task', ownerId: 't1', date, content: id,
});

describe('itemsOf', () => {
  it('filtra pelo tipo e id do dono', () => {
    const items = [
      { id: '1', ownerType: 'task', ownerId: 't1' },
      { id: '2', ownerType: 'project', ownerId: 't1' },
      { id: '3', ownerType: 'task', ownerId: 't2' },
    ] as const;
    expect(itemsOf(items, { ownerType: 'task', ownerId: 't1' }).map((i) => i.id)).toEqual(['1']);
  });
});

describe('sortBlockers', () => {
  it('ativos (mais novo primeiro) e depois resolvidos (resolvido mais recente primeiro)', () => {
    const sorted = sortBlockers([
      blocker('resolvido-antes', 'resolved', '01', '2026-10-02'),
      blocker('ativo-velho', 'active', '01'),
      blocker('resolvido-depois', 'resolved', '01', '2026-10-05'),
      blocker('ativo-novo', 'active', '03'),
    ]);
    expect(sorted.map((b) => b.id)).toEqual(['ativo-novo', 'ativo-velho', 'resolvido-depois', 'resolvido-antes']);
    expect(countActiveBlockers(sorted)).toBe(2);
  });
});

describe('sortQuestions', () => {
  it('em aberto primeiro (mais nova no topo), depois respondidas (resposta mais recente primeiro)', () => {
    const q = (id: string, status: 'open' | 'answered', created: string, answeredOn: string | null = null) => ({
      id, createdAt: stamp(created), updatedAt: stamp(created), ownerType: 'topic' as const, ownerId: 'k1',
      question: id, answer: '', status, answeredOn,
    });
    const sorted = sortQuestions([q('r-antes', 'answered', '01', '2026-10-02'), q('a-velha', 'open', '01'), q('r-depois', 'answered', '01', '2026-10-04'), q('a-nova', 'open', '03')]);
    expect(sorted.map((x) => x.id)).toEqual(['a-nova', 'a-velha', 'r-depois', 'r-antes']);
    expect(countOpenQuestions(sorted)).toBe(2);
  });
});

describe('sortProgressLogs', () => {
  it('dia mais recente primeiro; no mesmo dia, o último registrado no topo', () => {
    const sorted = sortProgressLogs([log('a', '2026-10-01', '01'), log('c', '2026-10-02', '02'), log('b', '2026-10-01', '03')]);
    expect(sorted.map((l) => l.id)).toEqual(['c', 'b', 'a']);
  });
});
