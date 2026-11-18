import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Recorte } from './Recorte';

const RESPOSTA = {
  recortes: [
    {
      titulo: 'Barreiras do AVA para alunos com baixa visão',
      pergunta: 'Quais barreiras o AVA impõe?',
      porQue: 'Problema real e testável.',
      risco: 'Poucos participantes.',
      primeiroPasso: 'Listar 5 telas do AVA.',
      ligacoes: ['interesse', 'problema', 'publico'],
    },
    { titulo: 'Checklist para professores', pergunta: 'P?', porQue: 'Prático.', risco: 'Medir.', primeiroPasso: 'Rascunhar.', ligacoes: ['viabilidade'] },
    { titulo: 'Comparar plataformas', pergunta: 'Q?', porQue: 'Analítico.', risco: 'Escopo.', primeiroPasso: 'Escolher 2.', ligacoes: [] },
  ],
  perguntaParaVoce: 'Você tem acesso a alunos com baixa visão?',
  protecao: { enviadoAIA: 'Interesse: Acessibilidade', substituicoes: 0 },
};

function simularApi(recorte: { status: number; corpo: unknown }) {
  const f = vi.fn(async (url: string, _init?: RequestInit) => {
    const r = url.endsWith('/status') ? { status: 200, corpo: { online: true } } : recorte;
    return new Response(JSON.stringify(r.corpo), { status: r.status, headers: { 'content-type': 'application/json' } });
  });
  vi.stubGlobal('fetch', f);
  return f;
}

const abrir = () =>
  render(
    <MemoryRouter initialEntries={['/recorte']}>
      <Recorte />
    </MemoryRouter>,
  );

afterEach(() => vi.unstubAllGlobals());

describe('Sala de Recorte', () => {
  it('cada ficha é um campo rotulado; só Interesse e Problema são obrigatórias', () => {
    simularApi({ status: 200, corpo: RESPOSTA });
    abrir();
    expect(screen.getByLabelText(/^Interesse/)).toBeRequired();
    expect(screen.getByLabelText(/^Problema/)).toBeRequired();
    expect(screen.getByLabelText(/^Público/)).not.toBeRequired();
    expect(screen.getByRole('button', { name: 'Ligar os fios' })).toBeDisabled();
  });

  it('com o exemplo da Ana, liga os fios e mostra 3 recortes carimbados, levando o foco ao resultado', async () => {
    const usuario = userEvent.setup();
    const f = simularApi({ status: 200, corpo: RESPOSTA });
    abrir();
    await usuario.click(screen.getByRole('button', { name: 'Preencher com o exemplo da Ana' }));
    await usuario.click(screen.getByRole('button', { name: 'Ligar os fios' }));
    const titulo = await screen.findByRole('heading', { name: 'Três recortes possíveis' });
    expect(titulo).toHaveFocus();
    expect(screen.getAllByRole('listitem').filter((li) => li.classList.contains('recorte'))).toHaveLength(3);
    expect(screen.getByText('Recorte A')).toBeInTheDocument();
    expect(screen.getByText('Ligado a: Interesse · Problema · Público')).toBeInTheDocument();
    expect(screen.getByText('Você tem acesso a alunos com baixa visão?')).toBeInTheDocument();
    const [, init] = f.mock.calls.find(([u]) => String(u).endsWith('/recorte'))!;
    expect(JSON.parse(String(init?.body)).fichas.interesse).toMatch(/Acessibilidade/);
  });

  it('"Puxar o fio" destaca no quadro as fichas ligadas ao recorte', async () => {
    const usuario = userEvent.setup();
    simularApi({ status: 200, corpo: RESPOSTA });
    abrir();
    await usuario.click(screen.getByRole('button', { name: 'Preencher com o exemplo da Ana' }));
    await usuario.click(screen.getByRole('button', { name: 'Ligar os fios' }));
    const [primeiro] = await screen.findAllByRole('button', { name: 'Puxar o fio deste recorte' });
    await usuario.click(primeiro);
    expect(primeiro).toHaveAttribute('aria-pressed', 'true');
    const ficha = (rotulo: RegExp) => screen.getByLabelText(rotulo).closest('.ficha-quadro');
    expect(ficha(/^Interesse/)).toHaveClass('ficha-quadro--ligada');
    expect(ficha(/^Viabilidade/)).not.toHaveClass('ficha-quadro--ligada');
  });

  it('erro da IA vira alerta e as fichas continuam preenchidas', async () => {
    const usuario = userEvent.setup();
    simularApi({ status: 502, corpo: { erro: 'A Lantern se embaralhou ao ligar os fios. Tente de novo.', codigo: 'RESPOSTA_INVALIDA' } });
    abrir();
    await usuario.click(screen.getByRole('button', { name: 'Preencher com o exemplo da Ana' }));
    await usuario.click(screen.getByRole('button', { name: 'Ligar os fios' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('embaralhou');
    expect(screen.getByLabelText(/^Interesse/)).toHaveValue('Acessibilidade digital e educação');
  });

  it('copia os recortes para levar ao orientador e confirma em região viva', async () => {
    const usuario = userEvent.setup();
    simularApi({ status: 200, corpo: RESPOSTA });
    const escrever = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: escrever }, configurable: true });
    abrir();
    fireEvent.change(screen.getByLabelText(/^Interesse/), { target: { value: 'Jogos' } });
    fireEvent.change(screen.getByLabelText(/^Problema/), { target: { value: 'Jogos sem legenda' } });
    await usuario.click(screen.getByRole('button', { name: 'Ligar os fios' }));
    await usuario.click(await screen.findByRole('button', { name: 'Copiar para levar ao orientador' }));
    expect(escrever.mock.calls[0][0]).toContain('Recorte A: Barreiras do AVA');
    const saidas = document.querySelectorAll('output');
    expect([...saidas].some((o) => within(o as HTMLElement).queryByText(/Recortes copiados/))).toBe(true);
  });
});
