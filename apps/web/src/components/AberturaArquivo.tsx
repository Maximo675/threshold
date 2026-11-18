import { useEffect, useState } from 'react';
import { useMenosMovimento } from '../hooks/useMenosMovimento';

const CHAVE = 'threshold:abertura-vista';
const LINHAS = ['PROTOCOLO TH-0001', 'VERIFICANDO CREDENCIAIS ............ OK', 'PSEUDONIMIZAÇÃO ATIVA ............... OK', 'ACESSANDO ARQUIVO'];
const DURACAO_MS = 1900;

function jaViu(): boolean {
  try {
    return sessionStorage.getItem(CHAVE) === '1';
  } catch {
    return false;
  }
}

function marcarVisto() {
  try {
    sessionStorage.setItem(CHAVE, '1');
  } catch {
    /* navegação privada sem storage: tudo bem, a abertura só aparece de novo */
  }
}

/**
 * Abertura "acessando arquivo" na primeira visita da sessão (menos de 2 segundos).
 * - Não aparece para quem pediu menos movimento.
 * - Qualquer clique ou tecla pula.
 * - É decorativa (aria-hidden): leitores de tela vão direto ao conteúdo.
 * - Sem flashes: só texto surgindo e um brilho âmbar suave (WCAG 2.3.1).
 */
export function AberturaArquivo() {
  const reduzir = useMenosMovimento();
  const [visivel, setVisivel] = useState(() => !reduzir && !jaViu());
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    if (!visivel) return;
    marcarVisto();
    const fechar = () => {
      setSaindo(true);
      window.setTimeout(() => setVisivel(false), 350);
    };
    const id = window.setTimeout(fechar, DURACAO_MS);
    window.addEventListener('keydown', fechar, { once: true });
    window.addEventListener('pointerdown', fechar, { once: true });
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', fechar);
      window.removeEventListener('pointerdown', fechar);
    };
  }, [visivel]);

  if (!visivel) return null;
  return (
    <div className={`abertura${saindo ? ' abertura--saindo' : ''}`} aria-hidden="true">
      <div className="abertura__caixa">
        <div className="abertura__lampada" />
        {LINHAS.map((linha, i) => (
          <p key={linha} className="abertura__linha" style={{ animationDelay: `${150 + i * 320}ms` }}>
            {linha}
            {i === LINHAS.length - 1 && <span className="maquina__cursor" />}
          </p>
        ))}
      </div>
    </div>
  );
}
