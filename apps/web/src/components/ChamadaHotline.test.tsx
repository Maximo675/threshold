import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _reiniciarSons } from '../hooks/useSons';
import { EVENTO_LIGAR } from '../prazos/hotline';
import type { Prazo } from '../prazos/prazos';
import { ChamadaHotline } from './ChamadaHotline';

/** Datas fixas: o teste não depende do dia em que roda. Prazo fictício mais próximo: 30/10/2026. */
const dia = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number);
  return () => new Date(a, m - 1, d, 10);
};

const PRAZOS: Prazo[] = [
  { id: 'orientador', titulo: 'Solicitar orientação a um professor', data: '2026-10-30', etapa: 2 },
  { id: 'projeto', titulo: 'Entregar o projeto de pesquisa', data: '2026-11-20', etapa: 3 },
  { id: 'entrega', titulo: 'Entrega oficial do TCC', data: '2026-12-16', etapa: 6 },
];

function abrir(hoje = dia('2026-10-19'), rota = '/dossie', prazos = PRAZOS) {
  const r = render(
    <MemoryRouter initialEntries={[rota]}>
      <ChamadaHotline hoje={hoje} prazos={prazos} />
    </MemoryRouter>,
  );
  act(() => {
    vi.advanceTimersByTime(2300); // espera a abertura terminar
  });
  return r;
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  sessionStorage.clear();
  _reiniciarSons();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Chamada da Hotline (lembrete de prazo)', () => {
  it('liga quando um prazo está a 14 dias ou menos e anuncia para leitores de tela', () => {
    abrir();
    expect(screen.getByRole('heading', { name: 'Chamada sobre o seu prazo' })).toBeInTheDocument();
    expect(document.querySelector('output')).toHaveTextContent(
      'A Hotline está ligando: Solicitar orientação a um professor, faltam 11 dias.',
    );
    // não rouba o foco de quem está usando a página
    expect(document.body).toHaveFocus();
  });

  it('não liga se nenhum prazo estiver perto', () => {
    abrir(dia('2026-10-01')); // 29 dias
    expect(screen.queryByRole('heading', { name: /Chamada/ })).not.toBeInTheDocument();
  });

  it('não liga no Briefing (primeiro acesso)', () => {
    abrir(dia('2026-10-19'), '/');
    expect(screen.queryByRole('heading', { name: /Chamada/ })).not.toBeInTheDocument();
  });

  it('não liga no painel do orientador (os prazos são da aluna)', () => {
    abrir(dia('2026-10-19'), '/painel');
    expect(screen.queryByRole('heading', { name: /Chamada/ })).not.toBeInTheDocument();
  });

  it('prazo já resolvido não gera ligação e não entra na agenda', () => {
    abrir(dia('2026-10-19'), '/dossie', [{ ...PRAZOS[0]!, concluido: true }, PRAZOS[1]!, PRAZOS[2]!]);
    expect(screen.queryByRole('heading', { name: /Chamada/ })).not.toBeInTheDocument();
  });

  it('"Atender" mostra o recado e os prazos, leva o foco para eles e não liga de novo hoje', () => {
    const { unmount } = abrir();
    fireEvent.click(screen.getByRole('button', { name: 'Atender' }));
    const titulo = screen.getByRole('heading', { name: 'Prazos do seu TCC' });
    expect(titulo).toHaveFocus();
    expect(screen.getAllByText(/Aqui é a/).length).toBeGreaterThan(0);
    const agenda = screen.getByRole('list', { name: 'Próximos prazos' });
    expect(agenda).toHaveTextContent('30/10 · faltam 11 dias');
    expect(agenda).toHaveTextContent('20/11 · faltam 32 dias');
    expect(agenda).toHaveTextContent('16/12 · faltam 58 dias');
    expect(localStorage.getItem('threshold:hotline-atendida')).toBe('2026-10-19');
    unmount();
    abrir(); // voltou à plataforma no mesmo dia
    expect(screen.queryByRole('heading', { name: /Chamada/ })).not.toBeInTheDocument();
  });

  it('no dia seguinte, liga de novo', () => {
    localStorage.setItem('threshold:hotline-atendida', '2026-10-19');
    abrir(dia('2026-10-20'));
    expect(screen.getByRole('heading', { name: 'Chamada sobre o seu prazo' })).toBeInTheDocument();
  });

  it('"Agora não" fecha e só volta na próxima sessão', () => {
    const { unmount } = abrir();
    fireEvent.click(screen.getByRole('button', { name: 'Agora não' }));
    expect(screen.queryByRole('heading', { name: /Chamada/ })).not.toBeInTheDocument();
    expect(sessionStorage.getItem('threshold:hotline-adiada')).toBe('1');
    unmount();
    abrir();
    expect(screen.queryByRole('heading', { name: /Chamada/ })).not.toBeInTheDocument();
  });

  it('o botão de demonstração faz ligar mesmo depois de atender', () => {
    localStorage.setItem('threshold:hotline-atendida', '2026-10-19');
    abrir();
    act(() => {
      window.dispatchEvent(new Event(EVENTO_LIGAR));
    });
    expect(screen.getByRole('heading', { name: 'Chamada sobre o seu prazo' })).toBeInTheDocument();
  });

  it('a chamada tem o botão Sons, que desliga o toque na hora', () => {
    abrir();
    const sons = screen.getByRole('button', { name: 'Sons' });
    expect(sons).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(sons);
    expect(sons).toHaveAttribute('aria-pressed', 'false');
  });
});
