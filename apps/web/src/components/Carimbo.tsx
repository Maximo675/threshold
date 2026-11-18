import type { CSSProperties } from 'react';

type Tom = 'aprovado' | 'andamento' | 'alerta';

/**
 * Carimbo de status em caixa alta (componente "Carimbo" no Figma).
 * Entra "batendo" no papel (styles/animacoes.css); `atraso` em ms deixa vários carimbos baterem em sequência.
 */
export function Carimbo({ children, tom = 'aprovado', atraso }: { children: string; tom?: Tom; atraso?: number }) {
  const estilo = atraso === undefined ? undefined : ({ '--atraso-carimbo': `${atraso}ms` } as CSSProperties);
  return (
    <span className={`carimbo carimbo--${tom}`} style={estilo}>
      {children}
    </span>
  );
}

/**
 * Tarja preta (redacted). É decorativa: o leitor de tela ouve o `rotulo`, nunca o dado escondido.
 * Regra: o dado real NUNCA vai para o DOM; a tarja só ocupa o lugar dele.
 */
export function Tarja({ largura = 150, rotulo = 'informação protegida', bloqueado = false }: { largura?: number; rotulo?: string; bloqueado?: boolean }) {
  return (
    <>
      <span className={`tarja${bloqueado ? ' tarja--bloqueado' : ''}`} style={{ width: largura }} aria-hidden="true" />
      {rotulo && <span className="visually-hidden">{rotulo}</span>}
    </>
  );
}
