import { useEffect } from 'react';
import { useEfeitos } from '../hooks/useEfeitos';
import { useMenosMovimento } from '../hooks/useMenosMovimento';

/**
 * Atmosfera da plataforma (styles/atmosfera.css): a luz da Lantern que segue o cursor e o granulado de filme.
 *
 * Este componente só atualiza quatro variáveis CSS com a posição do mouse, no máximo uma vez por quadro
 * (requestAnimationFrame). Todo o resto é CSS. Fica desligado com "reduzir movimento", com o botão
 * "Efeitos de luz" desligado e em telas de toque (aí a luz fica parada, vinda de cima).
 * É decorativo: aria-hidden e sem capturar cliques.
 */
export function Ambiente() {
  const [efeitos] = useEfeitos();
  const reduzir = useMenosMovimento();
  const ativo = efeitos && !reduzir;

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.efeitos = ativo ? 'ligado' : 'desligado';
    const apagar = () => {
      for (const v of ['--luz-x', '--luz-y', '--px', '--py']) raiz.style.removeProperty(v);
    };
    if (!ativo) {
      apagar();
      return;
    }

    let quadro = 0;
    let x = 0;
    let y = 0;
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      if (quadro) return;
      quadro = requestAnimationFrame(() => {
        quadro = 0;
        raiz.style.setProperty('--luz-x', `${x}px`);
        raiz.style.setProperty('--luz-y', `${y}px`);
        raiz.style.setProperty('--px', ((x / window.innerWidth) * 2 - 1).toFixed(3));
        raiz.style.setProperty('--py', ((y / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener('pointermove', mover, { passive: true });
    document.documentElement.addEventListener('pointerleave', apagar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener('pointermove', mover);
      document.documentElement.removeEventListener('pointerleave', apagar);
      apagar();
    };
  }, [ativo]);

  return (
    <div className="ambiente" aria-hidden="true">
      <div className="ambiente__luz" />
      <div className="ambiente__grao" />
    </div>
  );
}
