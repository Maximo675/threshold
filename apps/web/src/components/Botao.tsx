import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';

type Variante = 'primario' | 'secundario';

interface BotaoProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  children: ReactNode;
  variante?: Variante;
  /** Se informado, o botão vira um link de navegação (elemento <a>), como manda a semântica. */
  para?: string;
  largo?: boolean;
}

/** Variantes do Bootstrap criadas para o tema do Threshold (styles/bootstrap-tema.css). */
const CLASSE_BOOTSTRAP: Record<Variante, string> = {
  primario: 'btn-lantern',
  secundario: 'btn-arquivo',
};

/**
 * Botão do Threshold (componente "Botão" no Figma), construído sobre o `.btn` do Bootstrap.
 * Primário = âmbar da Lantern (`btn-lantern`); secundário = contorno (`btn-arquivo`).
 * Os estados (hover, foco, ativo, desativado) vêm do Bootstrap; `botao` só garante a altura mínima de 52 px
 * (alvo de toque confortável) e a tipografia.
 */
export function Botao({ children, variante = 'primario', para, largo = false, type = 'button', ...resto }: BotaoProps) {
  const classe = ['btn', CLASSE_BOOTSTRAP[variante], 'botao', largo ? 'w-100' : ''].filter(Boolean).join(' ');
  if (para) {
    return (
      <Link to={para} className={classe}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classe} {...resto}>
      {children}
    </button>
  );
}
