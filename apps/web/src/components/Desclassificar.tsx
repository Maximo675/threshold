import type { CSSProperties, ReactNode } from 'react';

/**
 * Revela o conteúdo como um documento sendo desclassificado: uma tarja cobre o texto e desliza para o lado.
 * Puro CSS (styles/animacoes.css). Com "reduzir movimento", a tarja nem aparece.
 * O texto está sempre no DOM: leitores de tela leem normalmente desde o início.
 */
export function Desclassificar({ children, atraso = 0 }: { children: ReactNode; atraso?: number }) {
  return (
    <span className="desclassificar" style={{ '--atraso': `${atraso}ms` } as CSSProperties}>
      {children}
    </span>
  );
}
