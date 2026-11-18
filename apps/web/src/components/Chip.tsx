type Variante = 'destaque' | 'contorno';

/** Etiqueta curta (componente "Chip" no Figma). Usar dentro de uma lista: <ul className="chips"><li>…</li></ul>. */
export function Chip({ children, variante = 'contorno' }: { children: string; variante?: Variante }) {
  return <span className={`chip chip--${variante}`}>{children}</span>;
}
