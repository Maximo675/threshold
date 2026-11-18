import { useState } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import { Link, NavLink, useLocation } from 'react-router';
import { alunaFicticia } from '../data/ficticio';
import { useEfeitos } from '../hooks/useEfeitos';
import { Logo } from './Logo';

export type Perfil = 'aluno' | 'orientador';

const ABAS: Record<Perfil, { para: string; rotulo: string }[]> = {
  aluno: [
    { para: '/dossie', rotulo: 'Dossiê' },
    { para: '/recorte', rotulo: 'Recorte' },
    { para: '/referencias', rotulo: 'Referências' },
    { para: '/lantern', rotulo: 'Lantern' },
    { para: '/orientadores', rotulo: 'Orientadores' },
    { para: '/fortaleza', rotulo: 'Fortaleza' },
  ],
  orientador: [
    { para: '/painel', rotulo: 'Painel' },
    { para: '/fortaleza', rotulo: 'Fortaleza' },
  ],
};

const CHAVE_PERFIL = 'threshold:perfil';

/**
 * Sem login na demonstração, o perfil vem da tela: /painel é do orientador, as outras são da aluna.
 * A Fortaleza serve aos dois, então fica com o último perfil usado (guardado só nesta aba do navegador).
 */
function perfilDaRota(pathname: string): Perfil {
  const naFortaleza = pathname.startsWith('/fortaleza');
  let perfil: Perfil = pathname.startsWith('/painel') ? 'orientador' : 'aluno';
  try {
    if (naFortaleza) perfil = sessionStorage.getItem(CHAVE_PERFIL) === 'orientador' ? 'orientador' : 'aluno';
    else sessionStorage.setItem(CHAVE_PERFIL, perfil);
  } catch {
    /* sem storage: vale o perfil da rota */
  }
  return perfil;
}

interface Usuario {
  nome: string;
  detalhe: string;
}

const ORIENTADOR_PADRAO: Usuario = { nome: 'Prof. Ricardo Almeida', detalhe: 'Orientador · demonstração' };

/**
 * Cabeçalho do app (componente "Cabeçalho" no Figma), feito com a Navbar do Bootstrap (React-Bootstrap).
 * No computador, as abas ficam numa linha; abaixo de 992 px, elas se recolhem num menu com botão (☰).
 * A aba ativa recebe aria-current="page" (o NavLink do React Router cuida disso e da classe .active).
 */
export function Cabecalho({ usuario }: { usuario?: Usuario }) {
  const { pathname } = useLocation();
  const perfil = perfilDaRota(pathname);
  const [efeitos, alternarEfeitos] = useEfeitos();
  // Estado do menu recolhido (celular): controlado aqui para o botão anunciar aria-expanded ao leitor de tela
  const [menuAberto, setMenuAberto] = useState(false);
  const pessoa = usuario ?? (perfil === 'orientador' ? ORIENTADOR_PADRAO : alunaFicticia);
  const iniciais = pessoa.nome
    .replace(/^Profa?\.\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

  return (
    // role="banner": o elemento já é <header>, mas sem isso a Navbar o marcaria como "navigation",
    // e o menu de verdade é o <nav> logo abaixo
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
    <Navbar as="header" role="banner" expand="lg" className="cabecalho" expanded={menuAberto} onToggle={setMenuAberto}>
      <Logo />
      <Navbar.Toggle aria-controls="menu-principal" aria-expanded={menuAberto} label="Abrir ou fechar o menu" />
      <Navbar.Collapse id="menu-principal" className="cabecalho__menu">
      <nav className="cabecalho__nav" aria-label="Principal">
        <ul className="navbar-nav">
          {ABAS[perfil].map((aba) => (
            <li key={aba.para} className="nav-item">
              <NavLink to={aba.para} className="nav-link cabecalho__link">
                {aba.rotulo}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="usuario">
        <span className="usuario__avatar" aria-hidden="true">
          {iniciais}
        </span>
        <span className="usuario__texto">
          <strong>{pessoa.nome}</strong>
          <span className="muted">{pessoa.detalhe}</span>
          <span className="usuario__acoes">
            <Link to={perfil === 'aluno' ? '/painel' : '/dossie'} className="usuario__acao">
              {perfil === 'aluno' ? 'Ver como orientador' : 'Ver como aluna'}
            </Link>
            <button type="button" className="usuario__acao" aria-pressed={efeitos} onClick={alternarEfeitos}>
              Efeitos de luz
            </button>
          </span>
        </span>
      </div>
      </Navbar.Collapse>
    </Navbar>
  );
}
