import { pino, type DestinationStream } from 'pino';

/**
 * Logger estruturado. Regra da fortaleza: log NUNCA carrega dado pessoal nem conteúdo do TCC.
 * Por isso registramos só método, caminho (sem query string), status e tempo — e o redact
 * apaga qualquer campo sensível que escape por engano.
 */
export function criarLogger(level: string, destino?: DestinationStream) {
  const opcoes = {
    level,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', '*.email', '*.nome', '*.texto', '*.senha', '*.cpf'],
      censor: '[REMOVIDO]',
    },
  };
  // `destino` existe para a autoverificação da Fortaleza: ela grava num destino em memória e confere a censura
  return destino ? pino(opcoes, destino) : pino(opcoes);
}

export type Logger = ReturnType<typeof criarLogger>;
