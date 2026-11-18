import { Link } from 'react-router';

/** Marca do Threshold: um batente de porta com uma fresta de luz âmbar (o "limiar"). */
export function MarcaLimiar({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg width={(tamanho * 26) / 32} height={tamanho} viewBox="0 0 26 32" aria-hidden="true" focusable="false">
      <rect x="1.5" y="1.5" width="23" height="29" fill="none" stroke="var(--color-text)" strokeWidth="2" />
      <rect x="14" y="5" width="7" height="25" fill="var(--color-lantern)" />
    </svg>
  );
}

export function Logo({ para = '/dossie' }: { para?: string }) {
  return (
    <Link to={para} className="logo" aria-label="Threshold, ir para o dossiê">
      <MarcaLimiar />
      <span className="logo__wordmark" aria-hidden="true">
        THRESHOLD
      </span>
    </Link>
  );
}
