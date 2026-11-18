import { describe, expect, it } from 'vitest';
import { calcularPrazos, chaveDoDia, dataCurta, diasAte, prazosParaLigar, textoDias, urgencia } from './prazos';

const dia = (iso: string, hora = 10) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d, hora);
};

const PRAZOS = [
  { id: 'entrega', titulo: 'Entrega oficial', data: '2026-12-16', etapa: 6 },
  { id: 'orientador', titulo: 'Solicitar orientação', data: '2026-10-30', etapa: 2 },
];

describe('Prazos', () => {
  it('conta dias inteiros, sem depender da hora do dia', () => {
    expect(diasAte('2026-10-30', dia('2026-10-19', 23))).toBe(11);
    expect(diasAte('2026-10-30', dia('2026-10-30', 0))).toBe(0);
    expect(diasAte('2026-10-30', dia('2026-11-01'))).toBe(-2);
  });

  it('atravessa a virada do horário de verão sem errar o dia', () => {
    expect(diasAte('2026-11-10', dia('2026-10-30'))).toBe(11);
  });

  it('classifica a urgência', () => {
    expect([-1, 0, 3, 7, 8, 14, 15].map(urgencia)).toEqual([
      'vencido', 'hoje', 'urgente', 'urgente', 'proximo', 'proximo', 'tranquilo',
    ]);
  });

  it('escreve os dias em português', () => {
    expect([2, 1, 0, -1, -3].map(textoDias)).toEqual(['faltam 2 dias', 'falta 1 dia', 'é hoje', 'venceu ontem', 'venceu há 3 dias']);
    expect(dataCurta('2026-10-30')).toBe('30/10');
    expect(dataCurta('2026-10-30', true)).toBe('30/10/2026');
  });

  it('ordena do mais próximo ao mais distante', () => {
    expect(calcularPrazos(PRAZOS, dia('2026-10-19')).map((p) => p.id)).toEqual(['orientador', 'entrega']);
  });

  it('a Hotline só liga com prazo a 14 dias ou menos (ou vencido há até 7 dias)', () => {
    expect(prazosParaLigar(PRAZOS, dia('2026-10-10')).map((p) => p.id)).toEqual([]); // 20 dias
    expect(prazosParaLigar(PRAZOS, dia('2026-10-19')).map((p) => p.id)).toEqual(['orientador']); // 11 dias
    expect(prazosParaLigar(PRAZOS, dia('2026-11-05')).map((p) => p.id)).toEqual(['orientador']); // venceu há 6
    expect(prazosParaLigar(PRAZOS, dia('2026-11-10')).map((p) => p.id)).toEqual([]); // venceu há 11: sai do aviso
  });

  it('prazo concluído nunca gera ligação', () => {
    const feitos = PRAZOS.map((p) => ({ ...p, concluido: true }));
    expect(prazosParaLigar(feitos, dia('2026-10-19'))).toEqual([]);
  });

  it('chave do dia no horário local', () => {
    expect(chaveDoDia(dia('2026-03-05', 23))).toBe('2026-03-05');
  });
});
