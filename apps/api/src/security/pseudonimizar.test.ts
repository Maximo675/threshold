import { describe, expect, it } from 'vitest';
import { criarPseudonimizador } from './pseudonimizar.js';

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres!!';
const { pseudonimizar, restaurar } = criarPseudonimizador(SEGREDO);
const ana = { tipo: 'ALUNO' as const, nome: 'Ana Souza' };

describe('pseudonimizar — pessoas conhecidas', () => {
  it('troca o nome do aluno por um código, ignorando maiúsculas e acentos', () => {
    const { texto, substituicoes } = pseudonimizar('Revise o texto de Ana Souza, de ANA SOUZA e de Âna Sôuza.', [ana]);
    expect(texto).not.toMatch(/ana|souza/i);
    expect(texto.match(/ALUNO_[0-9A-F]{6}/g)).toHaveLength(3);
    expect(substituicoes).toBe(3);
  });

  it('reconhece a forma invertida da ABNT e devolve exatamente como estava', () => {
    const original = 'SOUZA, Ana. Meu TCC. Curitiba: Editora Exemplo, 2026.';
    const { texto, mapa } = pseudonimizar(original, [ana]);
    expect(texto).toMatch(/^ALUNO_[0-9A-F]{6}_ABNT\. Meu TCC\./);
    expect(restaurar(texto, mapa)).toBe(original);
  });

  it('não troca pedaços de outras palavras (Anabela Souzas continua igual)', () => {
    const { texto, substituicoes } = pseudonimizar('Anabela Souzas escreveu isto.', [ana]);
    expect(texto).toBe('Anabela Souzas escreveu isto.');
    expect(substituicoes).toBe(0);
  });

  it('gera o mesmo código para a mesma pessoa e códigos diferentes com outro segredo', () => {
    const a = pseudonimizar('Ana Souza', [ana]).texto;
    const b = pseudonimizar('ana souza', [ana]).texto;
    const outro = criarPseudonimizador('outro-segredo-tambem-com-32-caracteres-ou-mais').pseudonimizar('Ana Souza', [ana]).texto;
    expect(a).toBe(b);
    expect(outro).not.toBe(a);
  });

  it('mantém autores citados em referências (só pessoas da plataforma são trocadas)', () => {
    const ref = 'SILVA, Joana. Métodos de pesquisa. 2. ed. Exemplópolis: Editora Exemplo, 2021. 180 p.';
    expect(pseudonimizar(ref, [ana]).texto).toBe(ref);
  });
});

describe('pseudonimizar — dados que nunca devem chegar à IA', () => {
  it('troca qualquer e-mail por código reversível', () => {
    const original = 'Fale comigo em ana.souza@alunos.exemplo.edu.br ou prof@exemplo.com.';
    const { texto, mapa } = pseudonimizar(original);
    expect(texto).not.toContain('@');
    expect(texto.match(/EMAIL_[0-9A-F]{6}/g)).toHaveLength(2);
    expect(restaurar(texto, mapa)).toBe(original);
  });

  it('remove CPF com e sem pontuação, sem guardar o original', () => {
    const { texto, mapa } = pseudonimizar('CPF 123.456.789-09 e também 12345678909.');
    expect(texto).toBe('CPF [CPF REMOVIDO] e também [CPF REMOVIDO].');
    expect([...mapa.values()].join()).not.toMatch(/\d{11}|\d{3}\.\d{3}/);
  });

  it('remove telefones brasileiros', () => {
    const { texto } = pseudonimizar('Ligue (41) 99999-1234 ou +55 41 3333-4444.');
    expect(texto).toBe('Ligue [TELEFONE REMOVIDO] ou [TELEFONE REMOVIDO].');
  });

  it('não confunde ano, páginas e DOI com dados pessoais', () => {
    const ref = 'Revista Exemplo, v. 12, n. 3, p. 45-60, mar. 2024. DOI: 10.99999/rex.2024.0123.';
    expect(pseudonimizar(ref, [ana]).texto).toBe(ref);
  });
});

describe('restaurar e configuração', () => {
  it('ida e volta devolve o texto original', () => {
    const original = 'Ana Souza (ana@exemplo.com) pediu revisão. SOUZA, Ana. Título. 2026.';
    const { texto, mapa } = pseudonimizar(original, [ana]);
    expect(restaurar(texto, mapa)).toBe(original);
  });

  it('recusa segredo curto', () => {
    expect(() => criarPseudonimizador('curto')).toThrow(/32 caracteres/);
  });
});
