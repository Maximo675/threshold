import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dossieBase, dossieComOrientador, orientadoresBase, simularApi } from '../test/apiFalsa';
import { Orientadores } from './Orientadores';

const abrir = (rota = '/orientadores') =>
  render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/orientadores" element={<Orientadores />} />
        <Route path="/orientadores/:id" element={<Orientadores />} />
      </Routes>
    </MemoryRouter>,
  );

const api = (dossie = dossieBase(), extra = {}) =>
  simularApi({ 'GET /api/orientadores': { corpo: { orientadores: orientadoresBase() } }, 'GET /api/dossie': { corpo: dossie }, ...extra });

afterEach(() => vi.unstubAllGlobals());

describe('Ficha do orientador', () => {
  it('abre a ficha de maior afinidade com o tema e explica por que ela aparece', async () => {
    api();
    abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Prof. Ricardo Almeida' })).toBeInTheDocument();
    expect(screen.getByText('Afinidade alta')).toBeInTheDocument();
    expect(screen.getByText(/está nas áreas declaradas pelo professor/)).toBeInTheDocument();
  });

  it('anuncia a área em destaque e as vagas em texto, não só por cor ou quadradinhos', async () => {
    api();
    abrir();
    expect(await screen.findByText('(combina com o seu tema)', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('2 vagas abertas')).toBeInTheDocument();
  });

  it('não mostra ranking nem nota, e diz isso', async () => {
    api();
    abrir();
    expect(await screen.findByText(/Não existe ranking de professores/)).toBeInTheDocument();
    expect(screen.queryByText(/estrelas|nota \d|1º lugar/i)).not.toBeInTheDocument();
  });

  it('abre cada ficha pela URL e, ao trocar pelo link, leva o foco ao nome do novo professor', async () => {
    api();
    abrir();
    await userEvent.click(await screen.findByRole('link', { name: /Profa. Helena Costa/ }));
    const titulo = screen.getByRole('heading', { level: 1 });
    expect(titulo).toHaveTextContent('Profa. Helena Costa');
    expect(titulo).toHaveFocus();
    expect(screen.getByText('1 vaga aberta')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Prof. Ricardo Almeida/ })).toHaveAttribute('href', '/orientadores/ricardo-almeida');
  });

  it('ficha inexistente não quebra a tela', async () => {
    api();
    abrir('/orientadores/nao-existe');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ficha não encontrada' })).toBeInTheDocument();
  });

  it('"Solicitar orientação" grava o pedido no servidor e mostra a confirmação com o atalho para o painel', async () => {
    const pendente = dossieBase({ pedido: { id: 7, orientadorId: 'ricardo-almeida', orientadorNome: 'Prof. Ricardo Almeida', estado: 'pendente', quando: '2026-11-14T13:00:00.000Z' } });
    const chamadas = api(dossieBase(), { 'POST /api/dossie/pedido': { corpo: pendente } });
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Solicitar orientação' }));
    expect(await screen.findByText('Pedido enviado')).toBeInTheDocument();
    expect(chamadas.find((c) => c.chave === 'POST /api/dossie/pedido')?.corpo).toEqual({ orientadorId: 'ricardo-almeida' });
    expect(screen.getByRole('link', { name: 'Ver como orientador (demo)' })).toHaveAttribute('href', '/painel/ricardo-almeida');
    expect(screen.getByRole('button', { name: 'Cancelar o pedido' })).toBeEnabled();
  });

  it('erro do servidor ao pedir aparece na tela, sem perder a ficha', async () => {
    api(dossieBase(), { 'POST /api/dossie/pedido': { status: 409, corpo: { erro: 'Este professor não tem vagas abertas neste semestre.' } } });
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Solicitar orientação' }));
    expect(await screen.findByText('Este professor não tem vagas abertas neste semestre.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Prof. Ricardo Almeida');
  });

  it('quem já tem orientador vê o carimbo na ficha dele e não pode pedir a outro', async () => {
    api(dossieComOrientador());
    abrir();
    expect(await screen.findByText('Seu orientador')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /Profa. Helena Costa/ }));
    expect(screen.getByRole('button', { name: 'Solicitar orientação' })).toBeDisabled();
    expect(screen.getByText('Você já é orientanda de Prof. Ricardo Almeida.')).toBeInTheDocument();
  });

  it('leva a pergunta pronta para o Board na Lantern', async () => {
    api();
    abrir();
    expect(await screen.findByRole('link', { name: /Perguntar ao Board/ })).toHaveAttribute(
      'href',
      '/lantern?pergunta=Que%20orientador%20combina%20com%20o%20meu%20tema%3F',
    );
  });

  it('sem servidor, mostra o erro com o botão de tentar de novo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('falhou')));
    abrir();
    expect(await screen.findByRole('alert')).toHaveTextContent('Sem conexão com o servidor');
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
