import { useCallback, useEffect, useRef, useState } from 'react';
import { mensagemDeErro } from '../api/threshold';

/**
 * Carrega um dado da API e guarda os três estados que toda tela precisa mostrar: carregando, erro e pronto.
 * `buscar` deve ser estável (useCallback), porque trocar a função dispara uma nova busca.
 * `definir` troca o dado pelo que uma ação devolveu (as rotas de ação já respondem com o estado novo).
 *
 * `atualizarACadaMs` busca de novo em silêncio enquanto a aba está visível. É o que faz a tela da aluna
 * mudar sozinha quando o orientador aceita o pedido em outra janela. Uma busca silenciosa que começou
 * antes de uma ação da pessoa é descartada, para nunca sobrescrever o estado mais novo.
 */
export function useRecurso<T>(buscar: () => Promise<T>, atualizarACadaMs?: number) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);
  const geracao = useRef(0);

  useEffect(() => {
    let vivo = true;
    buscar().then(
      (d) => {
        if (!vivo) return;
        setDados(d);
        setErro(null);
      },
      (e) => {
        if (vivo) setErro(mensagemDeErro(e));
      },
    );
    return () => {
      vivo = false;
    };
  }, [buscar, versao]);

  useEffect(() => {
    if (!atualizarACadaMs) return;
    let vivo = true;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      const antes = geracao.current;
      buscar().then(
        (d) => {
          if (vivo && geracao.current === antes) setDados(d);
        },
        () => {
          /* falha passageira numa atualização silenciosa: fica com o que já está na tela */
        },
      );
    }, atualizarACadaMs);
    return () => {
      vivo = false;
      window.clearInterval(id);
    };
  }, [buscar, atualizarACadaMs]);

  const recarregar = useCallback(() => {
    setErro(null);
    setVersao((v) => v + 1);
  }, []);

  const definir = useCallback((novo: T) => {
    geracao.current++;
    setDados(novo);
  }, []);

  return { dados, erro, carregando: dados === null && erro === null, recarregar, definir };
}
