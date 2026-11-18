import { useEffect, useRef, useState } from 'react';
import { tocarSino, tocarTecla } from '../audio/somMaquina';
import { useMenosMovimento } from '../hooks/useMenosMovimento';
import { TextoFormatado } from './TextoFormatado';

interface Props {
  texto: string;
  /** Milissegundos por caractere. */
  velocidade?: number;
  aoTerminar?: () => void;
  /** Som de teclas e "ding" no fim (src/audio/somMaquina.ts). Sem animação, sem som. */
  som?: boolean;
}

/**
 * Texto que surge letra por letra, como numa máquina de escrever.
 * Acessibilidade: o leitor de tela recebe o texto INTEIRO de uma vez (span escondido),
 * e a animação visual fica aria-hidden — ninguém ouve letra por letra.
 * Clicar no texto mostra tudo na hora; com "reduzir movimento", já aparece pronto (e em silêncio).
 */
export function MaquinaDeEscrever({ texto, velocidade = 14, aoTerminar, som = false }: Props) {
  const reduzir = useMenosMovimento();
  const [contador, setMostrados] = useState(0);
  // Com "reduzir movimento" o texto aparece inteiro (derivado no render, sem efeito extra)
  const mostrados = reduzir ? texto.length : contador;
  const terminou = mostrados >= texto.length;
  const sinoTocou = useRef(false);

  useEffect(() => {
    if (terminou) {
      // o "ding" só toca se houve animação (com "reduzir movimento" o texto já nasce pronto)
      if (som && !reduzir && !sinoTocou.current) tocarSino();
      sinoTocou.current = true;
      aoTerminar?.();
      return;
    }
    const passo = Math.max(1, Math.round(texto.length / 400)); // textos longos andam mais rápido
    const id = window.setTimeout(() => {
      if (som) tocarTecla(texto[mostrados]);
      setMostrados((n) => Math.min(texto.length, n + passo));
    }, velocidade);
    return () => window.clearTimeout(id);
  }, [mostrados, terminou, texto, velocidade, aoTerminar, som, reduzir]);

  return (
    <>
      <span aria-hidden="true" onClick={() => setMostrados(texto.length)} className="maquina">
        <TextoFormatado texto={texto.slice(0, mostrados)} />
        {!terminou && <span className="maquina__cursor" />}
      </span>
      <span className="visually-hidden">
        <TextoFormatado texto={texto} />
      </span>
    </>
  );
}
