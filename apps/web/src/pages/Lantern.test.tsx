import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { _reiniciarSons } from '../hooks/useSons';
import { Lantern } from './Lantern';

/**
 * A tela da Lantern conversa com a API; aqui o fetch é simulado (nenhuma IA de verdade é chamada).
 * No jsdom não existe matchMedia, então useMenosMovimento() = true e a máquina de escrever mostra o texto na hora.
 */
type Rota = (url: string, init?: RequestInit) => { status: number; corpo: unknown } | Promise<{ status: number; corpo: unknown }>;

function simularApi(rota: Rota) {
  const fetchFalso = vi.fn(async (url: string, init?: RequestInit) => {
    const { status, corpo } = await rota(url, init);
    return new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

const RESPOSTA_ARCHIVIST = {
  agente: 'archivist',
  nomeAgente: 'Archivist',
  texto: 'O sobrenome vai em **maiúsculas** [ABNT-AUTOR-01].\nComo fica: SOUZA, Marina.',
  protecao: { enviadoAIA: 'Sou ALUNO_1f2e3d. Revise esta referência…', substituicoes: 1 },
};

const abrir = (rota = '/lantern') =>
  render(
    <MemoryRouter initialEntries={[rota]}>
      <Lantern />
    </MemoryRouter>,
  );

afterEach(() => {
  vi.unstubAllGlobals();
  _reiniciarSons();
  localStorage.clear();
});

describe('Tela da Lantern', () => {
  it('apresenta os quatro agentes com os nomes do universo do Threshold', async () => {
    simularApi(() => ({ status: 200, corpo: { online: true } }));
    abrir();
    const lista = screen.getByRole('list', { name: 'Agentes do Threshold' });
    for (const nome of ['Lantern', 'Archivist', 'Hotline', 'Board']) {
      expect(within(lista).getByText(nome)).toBeInTheDocument();
    }
    expect(await screen.findByRole('button', { name: /Qual é o meu próximo passo/ })).toBeEnabled();
  });

  it('avisa quando a IA não está configurada e bloqueia o envio', async () => {
    simularApi(() => ({ status: 200, corpo: { online: false } }));
    abrir();
    expect(await screen.findByText('A Lantern está offline.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar à Lantern' })).toBeDisabled();
  });

  it('envia uma sugestão, mostra a resposta com o selo do especialista e o painel de proteção', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi((url) =>
      url.endsWith('/status') ? { status: 200, corpo: { online: true } } : { status: 200, corpo: RESPOSTA_ARCHIVIST },
    );
    abrir();
    await usuario.click(await screen.findByRole('button', { name: /Revise esta referência/ }));

    const conversa = screen.getByRole('list', { name: 'Conversa com a Lantern' });
    expect(await within(conversa).findByText(/via Archivist/)).toBeInTheDocument();
    expect(within(conversa).getAllByText('maiúsculas').length).toBeGreaterThan(0);
    // **negrito** vira <strong>, nunca HTML cru
    const negritos = [...conversa.querySelectorAll('strong')].map((n) => n.textContent);
    expect(negritos).toContain('maiúsculas');
    expect(conversa.innerHTML).not.toContain('**');

    expect(screen.getByLabelText('Texto enviado à IA')).toHaveTextContent('ALUNO_1f2e3d');
    expect(screen.getByText('1 trecho(s) protegido(s) nesta conversa.')).toBeInTheDocument();

    const [, init] = fetchFalso.mock.calls.find(([url]) => String(url).endsWith('/mensagens'))!;
    expect(JSON.parse(String(init?.body))).toEqual({
      mensagens: [{ papel: 'aluno', texto: expect.stringContaining('Revise esta referência') }],
    });
  });

  it('Enter envia e Shift+Enter quebra a linha', async () => {
    const usuario = userEvent.setup();
    const fetchFalso = simularApi((url) =>
      url.endsWith('/status') ? { status: 200, corpo: { online: true } } : { status: 200, corpo: { ...RESPOSTA_ARCHIVIST, agente: 'hotline', nomeAgente: 'Hotline' } },
    );
    abrir();
    const campo = screen.getByLabelText('Sua mensagem');
    await usuario.type(campo, 'linha 1{Shift>}{Enter}{/Shift}linha 2');
    expect(campo).toHaveValue('linha 1\nlinha 2');
    await usuario.type(campo, '{Enter}');
    expect(await screen.findByText(/via Hotline/)).toBeInTheDocument();
    expect(campo).toHaveValue('');
    expect(fetchFalso).toHaveBeenCalledTimes(2);
  });

  it('mostra o erro como alerta e devolve o texto ao campo para tentar de novo', async () => {
    const usuario = userEvent.setup();
    simularApi((url) =>
      url.endsWith('/status')
        ? { status: 200, corpo: { online: true } }
        : { status: 504, corpo: { erro: 'A Lantern demorou demais para responder. Tente de novo.', codigo: 'IA_TEMPO_ESGOTADO' } },
    );
    abrir();
    const campo = screen.getByLabelText('Sua mensagem');
    await usuario.type(campo, 'Qual é o prazo?{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('demorou demais');
    expect(campo).toHaveValue('Qual é o prazo?');
    expect(screen.queryByText('Você')).not.toBeInTheDocument();
  });

  it('se o servidor responder que a IA não está configurada, passa para o modo offline', async () => {
    const usuario = userEvent.setup();
    simularApi((url) =>
      url.endsWith('/status')
        ? { status: 200, corpo: { online: true } }
        : { status: 503, corpo: { erro: 'A Lantern está offline: configure o provedor de IA.', codigo: 'IA_NAO_CONFIGURADA' } },
    );
    abrir();
    await usuario.type(screen.getByLabelText('Sua mensagem'), 'oi{Enter}');
    expect(await screen.findByText('A Lantern está offline.')).toBeInTheDocument();
  });

  it('?pergunta= deixa a pergunta escrita no campo, sem enviar sozinha', async () => {
    const fetchFalso = simularApi(() => ({ status: 200, corpo: { online: true } }));
    abrir('/lantern?pergunta=Que%20orientador%20combina%20com%20o%20meu%20tema%3F');
    expect(screen.getByLabelText('Sua mensagem')).toHaveValue('Que orientador combina com o meu tema?');
    await screen.findByRole('button', { name: 'Enviar à Lantern' });
    expect(fetchFalso.mock.calls.every(([url]) => String(url).endsWith('/status'))).toBe(true);
  });

  it('botão Sons: ligado por padrão, alterna e fica lembrado no navegador', async () => {
    // com movimento normal (o jsdom não tem matchMedia, então simulamos "não reduzir")
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    localStorage.clear();
    simularApi(() => ({ status: 200, corpo: { online: true } }));
    const { unmount } = abrir();
    const botao = screen.getByRole('button', { name: 'Sons' });
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('threshold:sons')).toBe('desligado');
    unmount();
    _reiniciarSons(); // simula recarregar a página: lê de novo do navegador
    abrir();
    expect(screen.getByRole('button', { name: 'Sons' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('com "reduzir movimento" não há animação nem som, então o botão de som não aparece', () => {
    simularApi(() => ({ status: 200, corpo: { online: true } }));
    abrir();
    expect(screen.queryByRole('button', { name: /Sons/ })).not.toBeInTheDocument();
  });

  it('limite por minuto: avisa uma vez, mostra a contagem no botão e libera sozinho', async () => {
    const usuario = userEvent.setup();
    simularApi((url) =>
      url.endsWith('/status')
        ? { status: 200, corpo: { online: true } }
        : {
            status: 429,
            corpo: { erro: 'A Lantern precisa de um respiro. Você pode perguntar de novo em 1 s.', codigo: 'LIMITE_POR_MINUTO', tenteEmSegundos: 1 },
          },
    );
    abrir();
    const campo = screen.getByLabelText('Sua mensagem');
    await usuario.type(campo, 'Oi{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('de novo em 1 s');
    expect(screen.getByRole('button', { name: 'Aguarde 1 s' })).toBeDisabled();
    expect(campo).toHaveValue('Oi'); // a pergunta não se perde
    expect(await screen.findByRole('button', { name: 'Enviar à Lantern' }, { timeout: 2500 })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
