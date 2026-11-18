import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { EtapaDossie } from '../api/threshold';
import { _reiniciarEfeitos } from '../hooks/useEfeitos';
import { Botao } from './Botao';
import { Cabecalho } from './Cabecalho';
import { Carimbo, Tarja } from './Carimbo';
import { Etapa } from './Etapa';

const comRotas = (ui: ReactNode, rota = '/') => render(<MemoryRouter initialEntries={[rota]}>{ui}</MemoryRouter>);

describe('Botao', () => {
  it('vira link quando recebe "para" (navegação é <a>, não <button>)', () => {
    comRotas(<Botao para="/dossie">Ir ao dossiê</Botao>);
    expect(screen.getByRole('link', { name: 'Ir ao dossiê' })).toHaveAttribute('href', '/dossie');
  });

  it('é um <button type="button"> por padrão, para não enviar formulários sem querer', () => {
    comRotas(<Botao>Enviar</Botao>);
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'button');
  });

  it('aplica a variante secundária', () => {
    comRotas(<Botao variante="secundario">Voltar</Botao>);
    // Botão do Bootstrap com a variante de contorno do tema do Threshold
    expect(screen.getByRole('button', { name: 'Voltar' })).toHaveClass('btn', 'btn-arquivo', 'botao');
  });
});

describe('Carimbo e Tarja', () => {
  it('mostra o texto do carimbo', () => {
    render(<Carimbo tom="andamento">Em andamento</Carimbo>);
    expect(screen.getByText('Em andamento')).toHaveClass('carimbo--andamento');
  });

  it('a tarja esconde o visual do leitor de tela e anuncia só o rótulo', () => {
    const { container } = render(<Tarja rotulo="nome protegido" />);
    expect(container.querySelector('.tarja')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('nome protegido')).toHaveClass('visually-hidden');
  });
});

describe('Cabecalho', () => {
  it('marca a aba da rota atual com aria-current="page"', () => {
    comRotas(<Cabecalho usuario={{ nome: 'Ana Souza', detalhe: 'teste' }} />, '/lantern');
    expect(screen.getByRole('link', { name: 'Lantern' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dossiê' })).not.toHaveAttribute('aria-current');
  });

  it('tem navegação nomeada para leitores de tela', () => {
    comRotas(<Cabecalho usuario={{ nome: 'Ana Souza', detalhe: 'teste' }} />);
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
  });

  it('a aluna vê as seis salas e o atalho para a visão do orientador', () => {
    comRotas(<Cabecalho />, '/dossie');
    const abas = within(screen.getByRole('navigation', { name: 'Principal' })).getAllByRole('link').map((a) => a.textContent);
    expect(abas).toEqual(['Dossiê', 'Recorte', 'Referências', 'Lantern', 'Orientadores', 'Fortaleza']);
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver como orientador' })).toHaveAttribute('href', '/painel');
  });

  it('no painel, o cabeçalho é do orientador; a Fortaleza mantém o último perfil usado', () => {
    const { unmount } = comRotas(<Cabecalho />, '/painel');
    expect(within(screen.getByRole('navigation', { name: 'Principal' })).getAllByRole('link').map((a) => a.textContent)).toEqual(['Painel', 'Fortaleza']);
    expect(screen.getByRole('link', { name: 'Ver como aluna' })).toHaveAttribute('href', '/dossie');
    unmount();
    comRotas(<Cabecalho />, '/fortaleza');
    expect(screen.getByRole('link', { name: 'Ver como aluna' })).toBeInTheDocument();
  });

  it('o botão "Efeitos de luz" começa ligado, alterna e fica lembrado', async () => {
    localStorage.clear();
    _reiniciarEfeitos();
    comRotas(<Cabecalho />, '/dossie');
    const botao = screen.getByRole('button', { name: 'Efeitos de luz' });
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(botao);
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('threshold:efeitos')).toBe('desligado');
    _reiniciarEfeitos();
  });
});

const etapa = (extra: Partial<EtapaDossie>): EtapaDossie => ({
  numero: 3,
  titulo: 'Projeto de pesquisa',
  estado: 'atual',
  descricao: 'Falta: entregar o projeto',
  checklist: [
    { id: 'e3-1', texto: 'Recortar o tema', feito: true },
    { id: 'e3-2', texto: 'Definir a pergunta', feito: false },
    { id: 'e3-3', texto: 'Marca sozinho', feito: false, automatico: true },
  ],
  ...extra,
});

describe('Etapa', () => {
  it('etapa atual recebe aria-current="step", carimbo de andamento e o checklist com a contagem', () => {
    render(
      <ol>
        <Etapa etapa={etapa({})} />
      </ol>,
    );
    expect(screen.getByText('Em andamento').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Checklist · 1 de 3')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Recortar o tema' })).toBeChecked();
  });

  it('marcar um item avisa a tela; item automático fica travado e etapa ocupada ignora o clique', async () => {
    const aoMarcar = vi.fn();
    const { rerender } = render(
      <ol>
        <Etapa etapa={etapa({})} aoMarcar={aoMarcar} />
      </ol>,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Definir a pergunta' }));
    expect(aoMarcar).toHaveBeenCalledWith('e3-2', true);
    expect(screen.getByRole('checkbox', { name: /Marca sozinho/ })).toBeDisabled();
    rerender(
      <ol>
        <Etapa etapa={etapa({})} aoMarcar={aoMarcar} ocupado />
      </ol>,
    );
    // ocupado: o campo continua focável (não perde o foco do teclado), mas o clique é ignorado
    const campo = screen.getByRole('checkbox', { name: 'Definir a pergunta' });
    expect(campo).toBeEnabled();
    await userEvent.click(campo);
    expect(aoMarcar).toHaveBeenCalledTimes(1);
  });

  it('etapa em revisão mostra o carimbo e trava o checklist', () => {
    render(
      <ol>
        <Etapa etapa={etapa({ estado: 'em-revisao' })} />
      </ol>,
    );
    expect(screen.getByText('Em revisão')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Definir a pergunta' })).toBeDisabled();
  });

  it('etapa classificada não mostra descrição nem checklist, só a tarja e o status', () => {
    render(
      <ol>
        <Etapa etapa={etapa({ numero: 4, estado: 'classificado', descricao: 'não deveria aparecer' })} />
      </ol>,
    );
    expect(screen.queryByText('não deveria aparecer')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText('CLASSIFICADO')).toBeInTheDocument();
  });
});
