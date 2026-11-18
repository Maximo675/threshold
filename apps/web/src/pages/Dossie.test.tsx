import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dossieBase, dossieComOrientador, simularApi } from '../test/apiFalsa';
import { Dossie } from './Dossie';

const abrir = () =>
  render(
    <MemoryRouter initialEntries={['/dossie']}>
      <Dossie />
    </MemoryRouter>,
  );

afterEach(() => vi.unstubAllGlobals());

describe('Dossiê', () => {
  it('mostra o que veio da API: tema, progresso, etapa atual e prazos', async () => {
    simularApi({ 'GET /api/dossie': { corpo: dossieBase() } });
    abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Acessibilidade em plataformas de ensino' })).toBeInTheDocument();
    const barra = screen.getByRole('progressbar', { name: 'Progresso do TCC' });
    expect(barra).toHaveAttribute('aria-valuenow', '1');
    expect(barra).toHaveAttribute('aria-valuemax', '6');
    expect(screen.getByText('Em andamento').closest('li')).toHaveTextContent('Escolha do orientador');
    expect(screen.getByText('CLASSIFICADO · LIBERA NA ETAPA 02')).toBeInTheDocument();
    expect(screen.getByText('ainda não escolhido')).toBeInTheDocument();
    expect(screen.getByText('01/01/2099', { exact: false })).toBeInTheDocument();
  });

  it('marcar um item do checklist salva no servidor e atualiza a contagem', async () => {
    const marcado = dossieBase();
    marcado.etapas[1]!.checklist[0]!.feito = true;
    const chamadas = simularApi({ 'GET /api/dossie': { corpo: dossieBase() }, 'PATCH /api/dossie/checklist/e2-1': { corpo: marcado } });
    abrir();
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Ler as fichas de pelo menos dois orientadores' }));
    expect(await screen.findByText('Checklist · 1 de 3')).toBeInTheDocument();
    expect(chamadas.find((c) => c.chave.startsWith('PATCH'))?.corpo).toEqual({ feito: true });
  });

  it('o cartão da Lantern aponta o próximo item em aberto, com o atalho certo', async () => {
    simularApi({ 'GET /api/dossie': { corpo: dossieBase() } });
    abrir();
    const cartao = (await screen.findByText('Lantern · próximo passo')).closest('section')!;
    expect(within(cartao).getByRole('heading', { name: 'Ler as fichas de pelo menos dois orientadores' })).toBeInTheDocument();
    expect(within(cartao).getByRole('link', { name: 'Ver orientadores' })).toHaveAttribute('href', '/orientadores');
  });

  it('com pedido pendente, mostra a espera, o atalho para o painel e deixa cancelar', async () => {
    const pendente = dossieBase({ pedido: { id: 7, orientadorId: 'helena-costa', orientadorNome: 'Profa. Helena Costa', estado: 'pendente', quando: '2026-11-14T13:00:00.000Z' } });
    const chamadas = simularApi({ 'GET /api/dossie': { corpo: pendente }, 'DELETE /api/dossie/pedido': { corpo: dossieBase() } });
    abrir();
    expect(await screen.findByRole('heading', { name: 'Pedido enviado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver como orientador (demo)' })).toHaveAttribute('href', '/painel/helena-costa');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar o pedido' }));
    expect((await screen.findAllByRole('link', { name: 'Ver orientadores' })).length).toBeGreaterThan(0);
    expect(chamadas.some((c) => c.chave === 'DELETE /api/dossie/pedido')).toBe(true);
  });

  it('a etapa só pode ser enviada ao orientador com o checklist completo', async () => {
    const completo = dossieComOrientador();
    completo.etapas[2]!.checklist.forEach((i) => (i.feito = true));
    const emRevisao = dossieComOrientador();
    emRevisao.etapas[2] = { ...completo.etapas[2]!, estado: 'em-revisao', descricao: 'Enviada. Aguardando revisão.' };
    const chamadas = simularApi({ 'GET /api/dossie': { corpo: dossieComOrientador() }, 'PATCH /api/dossie/checklist/e3-1': { corpo: completo }, 'POST /api/dossie/revisao': { corpo: emRevisao } });
    abrir();
    const enviar = await screen.findByRole('button', { name: 'Enviar etapa ao orientador' });
    expect(enviar).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Recortar o tema na Sala de Recorte' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Enviar etapa ao orientador' }));
    expect(await screen.findByText('Em revisão')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aguardando a revisão' })).toBeInTheDocument();
    expect(chamadas.some((c) => c.chave === 'POST /api/dossie/revisao')).toBe(true);
  });

  it('mostra as devolutivas do orientador, com tipo e autor', async () => {
    const d = dossieComOrientador({
      devolutivas: [
        { id: 2, etapa: 3, autor: 'Prof. Ricardo Almeida', tipo: 'devolutiva', texto: 'Bom recorte. Refine a pergunta.', quando: '2026-11-14T15:00:00.000Z' },
        { id: 1, etapa: 2, autor: 'Prof. Ricardo Almeida', tipo: 'sistema', texto: 'Pedido aceito. A etapa 3 foi liberada.', quando: '2026-11-14T14:00:00.000Z' },
      ],
    });
    simularApi({ 'GET /api/dossie': { corpo: d } });
    abrir();
    const cartao = (await screen.findByRole('heading', { name: 'Do seu orientador' })).closest('section')!;
    expect(within(cartao).getByText('Bom recorte. Refine a pergunta.')).toBeInTheDocument();
    expect(within(cartao).getByText(/^Devolutiva · etapa 3/)).toBeInTheDocument();
    expect(within(cartao).getByText(/^Aviso · etapa 2/)).toBeInTheDocument();
  });

  it('erro numa ação aparece sem derrubar a tela', async () => {
    simularApi({ 'GET /api/dossie': { corpo: dossieBase() }, 'PATCH /api/dossie/checklist/e2-1': { status: 409, corpo: { erro: 'Só dá para marcar itens da etapa em andamento.' } } });
    abrir();
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Ler as fichas de pelo menos dois orientadores' }));
    expect(await screen.findByText('Só dá para marcar itens da etapa em andamento.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('"Reiniciar a demonstração" pergunta antes (modal) e só então chama o servidor', async () => {
    const chamadas = simularApi({ 'GET /api/dossie': { corpo: dossieComOrientador() }, 'POST /api/demo/reiniciar': { corpo: dossieBase() } });
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Reiniciar a demonstração' }));
    const janela = await screen.findByRole('dialog', { name: 'Reiniciar a demonstração?' });
    // O foco começa na opção segura
    expect(within(janela).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    expect(chamadas.some((c) => c.chave === 'POST /api/demo/reiniciar')).toBe(false);
    await userEvent.click(within(janela).getByRole('button', { name: 'Reiniciar' }));
    expect(await screen.findByText('ainda não escolhido')).toBeInTheDocument();
    expect(chamadas.some((c) => c.chave === 'POST /api/demo/reiniciar')).toBe(true);
  });

  it('cancelar o modal não reinicia nada', async () => {
    const chamadas = simularApi({ 'GET /api/dossie': { corpo: dossieComOrientador() } });
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Reiniciar a demonstração' }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(chamadas.some((c) => c.chave === 'POST /api/demo/reiniciar')).toBe(false);
  });

  it('sem servidor, mostra o erro e tenta de novo quando pedem', async () => {
    const f = vi.fn().mockRejectedValueOnce(new TypeError('falhou')).mockResolvedValue(new Response(JSON.stringify(dossieBase())));
    vi.stubGlobal('fetch', f);
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Acessibilidade em plataformas de ensino' })).toBeInTheDocument();
  });
});
