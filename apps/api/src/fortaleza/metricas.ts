/**
 * Contadores da fortaleza desde que o servidor subiu. Só NÚMEROS: nenhum texto, nome ou endereço fica aqui.
 * Aparecem na tela "Fortaleza" para mostrar a proteção trabalhando durante a demonstração.
 */
export interface Metricas {
  desde: string;
  /** Pedidos enviados à IA (conversa, recorte e revisão de referências). */
  enviosParaIA: number;
  /** Nomes, e-mails, CPFs e telefones trocados ou removidos antes de sair do servidor. */
  trechosProtegidos: number;
  /** Tentativas de fechar a etiqueta que delimita o texto do aluno (prompt injection pelo delimitador). */
  etiquetasNeutralizadas: number;
  /** Requisições barradas por excesso (resposta 429). */
  bloqueiosPorLimite: number;
  /** Entradas recusadas por formato ou tamanho (resposta 400). */
  entradasRecusadas: number;
  /** Consultas a bases públicas (Crossref e BrasilAPI). */
  consultasExternas: number;
}

export function criarMetricas(agora: () => Date = () => new Date()): Metricas {
  return {
    desde: agora().toISOString(),
    enviosParaIA: 0,
    trechosProtegidos: 0,
    etiquetasNeutralizadas: 0,
    bloqueiosPorLimite: 0,
    entradasRecusadas: 0,
    consultasExternas: 0,
  };
}

/** Troca a etiqueta delimitadora por um marcador e conta quantas vezes isso aconteceu. */
export function neutralizarEtiqueta(texto: string, etiqueta: string, metricas?: Metricas): string {
  const re = new RegExp(`<\\/?\\s*${etiqueta}\\s*>`, 'gi');
  return texto.replace(re, () => {
    if (metricas) metricas.etiquetasNeutralizadas++;
    return '[etiqueta removida]';
  });
}
