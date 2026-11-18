import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { anaNoPainel, painelBase, simularApi } from '../test/apiFalsa';
import { Painel } from './Painel';

const abrir = (rota = '/painel') =>
  render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/painel" element={<Painel />} />
        <Route path="/painel/:id" element={<Painel />} />
      </Routes>
    </MemoryRouter>,
  );

const BASE = '/api/painel/ricardo-almeida';
const comPedido = () =>
  painelBase({
    pedidos: [{ id: 7, aluna: { nome: 'Ana Souza', detalhe: '7º período · Eng. de Software' }, tema: 'Acessibilidade em plataformas de ensino', quando: '2026-11-14T13:00:00.000Z', afinidade: 'alta', areaEmComum: 'Acessibilidade digital' }],
    resumo: { orientandos: 2, vagasAbertas: 2, aguardandoRevisao: 0, atrasados: 1, pedidosPendentes: 1 },
  });
const comAna = (situacao: 'em-dia' | 'aguardando-revisao' = 'em-dia') => {
  const p = painelBase();
  p.orientandos.unshift(anaNoPainel(situacao));
  return p;
};

afterEach(() => vi.unstubAllGlobals());

describe('Painel do orientador', () => {
  it('mostra o resumo em números e os orientandos com a situação em texto', async () => {
    simularApi({ [`GET ${BASE}`]: { corpo: painelBase() } });
    abrir();
    expect(await screen.findByRole('heading', { level: 1, name: 'Seus orientandos' })).toBeInTheDocument();
    const resumo = screen.getByLabelText('Resumo');
    expect(within(resumo).getByText('Atrasados').nextElementSibling).toHaveTextContent('1');
    expect(within(resumo).getByText('Vagas abertas').nextElementSibling).toHaveTextContent('2 de 5');
    expect(screen.getByText('Carla Dias').closest('li')).toHaveTextContent('Atrasado');
    expect(screen.getByText(/Sem ranking e sem nota de aluno/)).toBeInTheDocument();
  });

  it('sem orientanda da demo, ensina como ver o painel em ação', async () => {
    simularApi({ [`GET ${BASE}`]: { corpo: painelBase() } });
    abrir();
    expect(await screen.findByRole('heading', { name: 'Como ver o painel em ação' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para a ficha, como aluna' })).toHaveAttribute('href', '/orientadores/ricardo-almeida');
  });

  it('aceitar o pedido chama o servidor e confirma em região viva', async () => {
    const chamadas = simularApi({ [`GET ${BASE}`]: { corpo: comPedido() }, [`POST ${BASE}/pedidos/7`]: { corpo: comAna() } });
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Aceitar orientação' }));
    expect(await screen.findByText('Você aceitou orientar Ana Souza. A etapa 3 dela foi liberada.')).toBeInTheDocument();
    expect(chamadas.find((c) => c.chave.includes('/pedidos/7'))?.corpo).toEqual({ aceitar: true });
    expect(screen.queryByRole('button', { name: 'Aceitar orientação' })).not.toBeInTheDocument();
    expect(screen.getByText('Ana Souza').closest('li')).toHaveTextContent('checklist 1 de 2');
  });

  it('recusar o pedido abre uma confirmação (modal) antes de chamar o servidor', async () => {
    const chamadas = simularApi({ [`GET ${BASE}`]: { corpo: comPedido() }, [`POST ${BASE}/pedidos/7`]: { corpo: painelBase() } });
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Não posso neste semestre' }));
    const janela = await screen.findByRole('dialog', { name: 'Recusar o pedido?' });
    expect(janela).toHaveTextContent('Ana Souza');
    expect(chamadas.some((c) => c.chave === `POST ${BASE}/pedidos/7`)).toBe(false);
    await userEvent.click(within(janela).getByRole('button', { name: 'Recusar o pedido' }));
    expect(await screen.findByText(/Pedido recusado/)).toBeInTheDocument();
    const envio = chamadas.find((c) => c.chave === `POST ${BASE}/pedidos/7`);
    expect(envio?.corpo).toEqual({ aceitar: false });
  });

  it('enviar devolutiva: botão só liga com texto, manda ao servidor e limpa o campo', async () => {
    const depois = comAna();
    depois.devolutivas = [{ id: 1, etapa: 3, autor: 'Prof. Ricardo Almeida', tipo: 'devolutiva', texto: 'Bom recorte.', quando: '2026-11-14T15:00:00.000Z' }];
    const chamadas = simularApi({ [`GET ${BASE}`]: { corpo: comAna() }, [`POST ${BASE}/devolutivas`]: { corpo: depois } });
    abrir();
    const enviar = await screen.findByRole('button', { name: 'Enviar devolutiva' });
    expect(enviar).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Sua devolutiva'), 'Bom recorte.');
    await userEvent.click(enviar);
    expect(await screen.findByText('Devolutiva enviada. Ela já aparece no dossiê da aluna.')).toBeInTheDocument();
    expect(chamadas.find((c) => c.chave.endsWith('/devolutivas'))?.corpo).toEqual({ texto: 'Bom recorte.' });
    expect(screen.getByLabelText('Sua devolutiva')).toHaveValue('');
    expect(screen.getByText('Bom recorte.')).toBeInTheDocument();
  });

  it('etapa aguardando revisão: aprovar é livre, devolver exige o motivo', async () => {
    const chamadas = simularApi({ [`GET ${BASE}`]: { corpo: comAna('aguardando-revisao') }, [`POST ${BASE}/revisao`]: { corpo: comAna() } });
    abrir();
    expect(await screen.findByRole('heading', { name: 'Revisar a etapa 3: Projeto de pesquisa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Devolver para ajustes' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Sua devolutiva'), 'Refine os objetivos.');
    await userEvent.click(screen.getByRole('button', { name: 'Devolver para ajustes' }));
    expect(await screen.findByText('Etapa devolvida para ajustes, com a sua devolutiva.')).toBeInTheDocument();
    expect(chamadas.find((c) => c.chave.endsWith('/revisao'))?.corpo).toEqual({ decisao: 'devolver', texto: 'Refine os objetivos.' });
  });

  it('pedir lembrete à Hotline marca o orientando como avisado hoje', async () => {
    const depois = painelBase();
    depois.orientandos[1]!.lembreteEm = new Date().toISOString();
    const chamadas = simularApi({ [`GET ${BASE}`]: { corpo: painelBase() }, [`POST ${BASE}/lembretes`]: { corpo: depois } });
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Pedir lembrete à Hotline para Carla Dias' }));
    expect(await screen.findByRole('button', { name: /Hotline avisada hoje para Carla Dias/ })).toBeDisabled();
    expect(chamadas.find((c) => c.chave.endsWith('/lembretes'))?.corpo).toEqual({ orientandoId: 'carla' });
  });

  it('erro do servidor aparece e o painel continua na tela', async () => {
    simularApi({ [`GET ${BASE}`]: { corpo: comPedido() }, [`POST ${BASE}/pedidos/7`]: { status: 409, corpo: { erro: 'Sem vagas abertas para aceitar o pedido.' } } });
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Aceitar orientação' }));
    expect(await screen.findByText('Sem vagas abertas para aceitar o pedido.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aceitar orientação' })).toBeEnabled();
  });

  it('dá para trocar de professor pela navegação da demonstração', async () => {
    simularApi({ [`GET ${BASE}`]: { corpo: painelBase() } });
    abrir();
    const nav = await screen.findByRole('navigation', { name: 'Professor da demonstração' });
    expect(within(nav).getByRole('link', { name: 'Prof. Ricardo Almeida' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Profa. Helena Costa' })).toHaveAttribute('href', '/painel/helena-costa');
  });
});
