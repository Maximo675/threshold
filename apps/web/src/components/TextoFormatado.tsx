import { Fragment } from 'react';

/**
 * Mostra texto da IA com segurança: só entende **negrito** e quebras de linha.
 * Nada vira HTML (sem dangerouslySetInnerHTML) — saída do modelo nunca executa nada (OWASP LLM05).
 */
export function TextoFormatado({ texto }: { texto: string }) {
  const partes = texto.split('**');
  return (
    <>
      {partes.map((parte, i) => {
        const linhas = parte.split('\n').map((linha, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {linha}
          </Fragment>
        ));
        // Trechos de índice ímpar ficaram entre ** e **. Se o último ** ainda não fechou, fica normal.
        const fechado = i % 2 === 1 && i < partes.length - 1;
        return fechado ? <strong key={i}>{linhas}</strong> : <Fragment key={i}>{linhas}</Fragment>;
      })}
    </>
  );
}
