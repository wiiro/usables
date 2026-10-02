import { describe, expect, it } from 'vitest';
import { sampleState } from '../../test/fixtures';
import type { AppState } from '../../types/state';
import { addIdea, addQuestion, answerQuestion, deleteQuestion, reopenQuestion } from './sections';
import {
  createSubject, createTopic, deleteSubject, deleteTopic, setTopicOccurrenceDone, setTopicPlannedDate,
  setTopicRecurrence, updateTopic,
} from './study';

const NOW = '2026-10-02T09:00:00.000Z';
const topic = (state: AppState, id = 'k1') => state.topics.find((t) => t.id === id)!;

describe('matérias', () => {
  it('cria com nome limpo', () => {
    const state = sampleState();
    createSubject(state, { name: ' Estatística ', description: '', color: '#059669' }, { id: 'm2', now: NOW });
    expect(state.subjects.at(-1)).toMatchObject({ id: 'm2', name: 'Estatística', createdAt: NOW });
  });

  it('excluir leva junto os tópicos e as seções deles, sem tocar no resto', () => {
    const state = sampleState();
    createSubject(state, { name: 'Outra', description: '', color: '#000' }, { id: 'm2', now: NOW });
    createTopic(state, { subjectId: 'm2', title: 'Fica' }, { id: 'k2', now: NOW });
    addIdea(state, { ownerType: 'topic', ownerId: 'k1' }, { title: 'some', description: '', date: '2026-10-02' }, { id: 'i9', now: NOW });

    deleteSubject(state, 'm1');

    expect(state.subjects.map((s) => s.id)).toEqual(['m2']);
    expect(state.topics.map((t) => t.id)).toEqual(['k2']);
    expect(state.progressLogs).toEqual([]); // l1 era do tópico k1
    expect(state.questions).toEqual([]);
    expect(state.ideas.map((i) => i.id)).toEqual(['i1']); // a ideia do projeto fica
    expect(state.tasks).toHaveLength(1);
  });
});

describe('tópicos', () => {
  it('cria "não iniciado", no fim da ordem, com data opcional', () => {
    const state = sampleState();
    createTopic(state, { subjectId: 'm1', title: ' Regressão ', plannedDate: '2026-10-10' }, { id: 'k2', now: NOW });
    expect(topic(state, 'k2')).toMatchObject({ title: 'Regressão', status: 'not_started', plannedDate: '2026-10-10', order: 2 });
  });

  it('não cria em matéria inexistente nem move para ela', () => {
    const state = sampleState();
    expect(() => createTopic(state, { subjectId: 'x', title: 'a' }, { id: 'k2', now: NOW })).toThrow('Matéria não encontrado');
    expect(() => updateTopic(state, 'k1', { subjectId: 'x' }, NOW)).toThrow();
  });

  it('repetição exige data planejada; tirar a data tira a repetição', () => {
    const state = sampleState();
    expect(() => setTopicRecurrence(state, 'k1', { freq: 'daily' }, NOW)).toThrow('data planejada');
    setTopicPlannedDate(state, 'k1', '2026-10-05', NOW);
    setTopicRecurrence(state, 'k1', { freq: 'weekly', weekdays: [1] }, NOW);
    expect(topic(state).recurrence).toEqual({ freq: 'weekly', weekdays: [1] });
    setTopicPlannedDate(state, 'k1', null, NOW);
    expect(topic(state)).toMatchObject({ plannedDate: null, recurrence: null, completedOccurrences: [] });
  });

  it('marca e desmarca ocorrências válidas; recusa datas fora da série', () => {
    const state = sampleState();
    setTopicPlannedDate(state, 'k1', '2026-10-05', NOW); // segunda
    setTopicRecurrence(state, 'k1', { freq: 'weekly', weekdays: [1] }, NOW);

    setTopicOccurrenceDone(state, 'k1', '2026-10-12', true, NOW);
    setTopicOccurrenceDone(state, 'k1', '2026-10-05', true, NOW);
    expect(topic(state).completedOccurrences).toEqual(['2026-10-05', '2026-10-12']);

    setTopicOccurrenceDone(state, 'k1', '2026-10-05', false, NOW);
    expect(topic(state).completedOccurrences).toEqual(['2026-10-12']);

    expect(() => setTopicOccurrenceDone(state, 'k1', '2026-10-06', true, NOW)).toThrow('não é uma ocorrência');
  });

  it('excluir leva as seções do tópico', () => {
    const state = sampleState();
    deleteTopic(state, 'k1');
    expect(state.topics).toEqual([]);
    expect(state.progressLogs).toEqual([]);
    expect(state.questions).toEqual([]);
  });
});

describe('dúvidas', () => {
  it('nasce em aberto; responder grava resposta e data; reabrir mantém a resposta', () => {
    const state = sampleState();
    addQuestion(state, 'k1', ' O que é p-valor? ', { id: 'q2', now: NOW });
    expect(state.questions.at(-1)).toMatchObject({ question: 'O que é p-valor?', status: 'open', answer: '', answeredOn: null });

    answerQuestion(state, 'q2', ' Probabilidade sob H0. ', '2026-10-02', NOW);
    expect(state.questions.at(-1)).toMatchObject({ status: 'answered', answer: 'Probabilidade sob H0.', answeredOn: '2026-10-02' });

    reopenQuestion(state, 'q2', NOW);
    expect(state.questions.at(-1)).toMatchObject({ status: 'open', answeredOn: null, answer: 'Probabilidade sob H0.' });

    deleteQuestion(state, 'q2');
    expect(state.questions.map((q) => q.id)).toEqual(['q1']);
  });

  it('só em tópico existente', () => {
    expect(() => addQuestion(sampleState(), 'nao-existe', 'x', { id: 'q2', now: NOW })).toThrow('Dono da seção');
  });
});
