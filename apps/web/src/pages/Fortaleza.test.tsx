import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { simularApi } from '../test/apiFalsa';
import { Fortaleza } from './Fortaleza';

const abrir = () =>
  render(
    <MemoryRouter initialEntries={['/fortaleza']}>
      <Fortaleza />
    </MemoryRouter>,
  );

const relatorio = (ok = true) => ({
  geradoEm: '2026-11-14T15:30:00.000Z',
  verificacoes: [
    { id: 'tarja', camada: 'Dados pessoais', titulo: 'Nomes, e-mails, CPF e telefone não saem do servidor', comoTestamos: 'Um texto de teste passa pela tarja.', ok },
    { id: 'log', camada: 'Registros', titulo: 'O registro (log) do servidor censura dados pessoais', comoTestamos: 'O logger grava num destino de teste.', ok: true },
  ],
  aprovadas: ok ? 2 : 1,
  contadores: { desde: '2026-11-14T12:00:00.000Z', enviosParaIA: 4, trechosProtegidos: 9, etiquetasNeutralizadas: 1, bloqueiosPorLimite: 0, entradasRecusadas: 2, consultasExternas: 3 },
  configuracao: { iaConfigurada: true, provedor: 'anthropic', limiteGeralPorMinuto: 60, limiteIaPorMinuto: 20, corpoMaximoKb: 100, tempoMaximoIaSegundos: 30, regrasAbnt: 23, pessoasProtegidasNaDemo: 4 },
  pendencias: ['Login com segundo fator (MFA) e controle de acesso por perfil'],
});

const CABECALHOS_BONS = { 'content-security-policy': "default-src 'self';script-src 'self';frame-ancestors 'self'", 'x-content-type-options': 'nosniff', 'x-frame-options': 'SAMEORIGIN' };

afterEach(() => vi.unstubAllGlobals());

describe('Tela Fortaleza', () => {
  it('soma as verificações do servidor com as do navegador (cabeçalhos da própria resposta)', async () => {
    simularApi({ 'GET /api/fortaleza/relatorio': { corpo: relatorio(), cabecalhos: CABECALHOS_BONS } });
    abrir();
    expect(await screen.findByText('6 de 6')).toBeInTheDocument();
    expect(screen.getAllByText('Aprovado')).toHaveLength(6);
    expect(screen.getByText('A página só carrega código do próprio Threshold (CSP)')).toBeInTheDocument();
  });

  it('cabeçalho de segurança faltando ou verificação reprovada aparece como "Falhou"', async () => {
    simularApi({ 'GET /api/fortaleza/relatorio': { corpo: relatorio(false), cabecalhos: { 'x-powered-by': 'Express' } } });
    abrir();
    expect(await screen.findByText('1 de 6')).toBeInTheDocument();
    expect(screen.getAllByText('Falhou')).toHaveLength(5);
    expect(screen.getByText('O servidor não anuncia a tecnologia que usa').closest('li')).toHaveTextContent('Falhou');
  });

  it('mostra os contadores da sessão, a configuração e as pendências, sem esconder o que falta', async () => {
    simularApi({ 'GET /api/fortaleza/relatorio': { corpo: relatorio(), cabecalhos: CABECALHOS_BONS } });
    abrir();
    const sessao = (await screen.findByRole('heading', { name: 'Nesta sessão' })).closest('section')!;
    expect(within(sessao).getByText('Trechos tarjados').nextElementSibling).toHaveTextContent('9');
    expect(screen.getByText('Ligada (anthropic). A chave fica só no servidor.')).toBeInTheDocument();
    expect(screen.getByText('Login com segundo fator (MFA) e controle de acesso por perfil')).toBeInTheDocument();
  });

  it('"Teste a tarja": mostra o texto original ao lado do que a IA receberia e resume o que foi protegido', async () => {
    const chamadas = simularApi({
      'GET /api/fortaleza/relatorio': { corpo: relatorio(), cabecalhos: CABECALHOS_BONS },
      'POST /api/fortaleza/tarjar': { corpo: { protegido: 'Sou a ALUNO_1A2B3C, [CPF REMOVIDO]', substituicoes: 2, resumo: { pessoas: 1, emails: 0, cpfs: 1, telefones: 0 } } },
    });
    abrir();
    await userEvent.type(await screen.findByLabelText('Texto para tarjar'), 'Sou a Ana Souza, 123.456.789-09');
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar a tarja' }));
    expect(await screen.findByText('Sou a ALUNO_1A2B3C, [CPF REMOVIDO]')).toBeInTheDocument();
    const painel = document.querySelector('.tarjado') as HTMLElement;
    expect(within(painel).getByText('Sou a Ana Souza, 123.456.789-09')).toBeInTheDocument();
    expect(screen.getAllByText(/1 nome virou código · 1 CPF removido/).length).toBeGreaterThan(0);
    expect(chamadas.find((c) => c.chave === 'POST /api/fortaleza/tarjar')?.corpo).toEqual({ texto: 'Sou a Ana Souza, 123.456.789-09' });
  });

  it('"Rodar de novo" refaz as verificações e confirma a hora', async () => {
    const chamadas = simularApi({ 'GET /api/fortaleza/relatorio': { corpo: relatorio(), cabecalhos: CABECALHOS_BONS } });
    abrir();
    await userEvent.click(await screen.findByRole('button', { name: 'Rodar de novo' }));
    expect(await screen.findByText(/Verificações refeitas às/)).toBeInTheDocument();
    expect(chamadas.filter((c) => c.chave === 'GET /api/fortaleza/relatorio')).toHaveLength(2);
  });
});
