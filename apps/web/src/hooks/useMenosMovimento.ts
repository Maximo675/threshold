import { useEffect, useState } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

/**
 * true quando a pessoa pediu menos movimento no sistema (ou quando o navegador não informa).
 * Todas as animações do Threshold consultam isto: com "reduzir movimento", tudo aparece pronto.
 */
export function useMenosMovimento(): boolean {
  const [reduzir, setReduzir] = useState(() => (typeof window.matchMedia === 'function' ? window.matchMedia(CONSULTA).matches : true));

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(CONSULTA);
    const mudar = () => setReduzir(mq.matches);
    mq.addEventListener('change', mudar);
    return () => mq.removeEventListener('change', mudar);
  }, []);

  return reduzir;
}
