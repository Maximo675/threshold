import { ZodError } from 'zod';
import type { Metricas } from '../fortaleza/metricas.js';
import type { Logger } from '../logger.js';
import { ErroProvedorIA, type InfoResposta, type ProvedorIA } from './provedores.js';

/**
 * Tarefas em que a IA devolve JSON (Sala de Recorte, revisão em lote das referências).
 *
 * O que aprendemos em 14/11/2026, testando com a chave real: o Claude Haiku 5.5 "pensa" antes de responder,
 * e esse raciocínio gasta o mesmo teto de tokens do texto. Com um teto justo, o JSON chegava cortado no meio,
 * e o aluno via "a Lantern se embaralhou" todas as vezes. Por isso:
 *  - o teto é folgado, e a segunda tentativa usa um teto 50% maior;
 *  - o log diz o MOTIVO de cada falha (cortada, sem JSON, formato) e quais campos falharam, nunca o conteúdo;
 *  - quem valida aproveita o que veio certo em vez de recusar a resposta inteira (veja `encurtar` e `aproveitar`).
 */

/** Tira o JSON da resposta mesmo se o modelo cercar com ```json ou com uma frase. */
export function extrairJson(texto: string): unknown {
  const inicio = texto.indexOf('{');
  const fim = texto.lastIndexOf('}');
  if (inicio === -1 || fim <= inicio) throw new SyntaxError('sem JSON');
  return JSON.parse(texto.slice(inicio, fim + 1));
}

/** Texto longo demais para a tela é encurtado na última palavra inteira, em vez de derrubar a resposta toda. */
export function encurtar(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const corte = texto.slice(0, limite - 1);
  const espaco = corte.lastIndexOf(' ');
  return `${(espaco > limite * 0.6 ? corte.slice(0, espaco) : corte).replace(/[\s,;:.]+$/, '')}…`;
}

/** Valida item por item e fica com os que passaram: um item ruim não derruba os outros. */
export function aproveitar<T>(itens: unknown[], validar: (item: unknown) => T): { bons: T[]; ruins: number; primeiroErro?: unknown } {
  const bons: T[] = [];
  let primeiroErro: unknown;
  for (const item of itens) {
    try {
      bons.push(validar(item));
    } catch (erro) {
      primeiroErro ??= erro;
    }
  }
  return { bons, ruins: itens.length - bons.length, primeiroErro };
}

/** Caminhos dos campos que falharam (ex.: "recortes.0.risco"), sem nenhum valor: seguro para o log. */
function camposComProblema(erro: unknown): string[] | undefined {
  if (!(erro instanceof ZodError)) return undefined;
  return [...new Set(erro.issues.map((i) => `${i.path.join('.') || '(raiz)'}:${i.code}`))].slice(0, 8);
}

interface PedidoJson<T> {
  provedor: ProvedorIA;
  sistema: string;
  mensagem: string;
  maxTokens: number;
  signal: AbortSignal;
  /** Recebe o JSON já lido e devolve o resultado validado; lança erro se não servir. */
  validar: (dados: unknown) => T;
  logger: Logger;
  rota: string;
  metricas?: Metricas;
}

/** Pede o JSON até duas vezes. Devolve null se nenhuma das respostas servir (falha de rede ou do provedor é lançada). */
export async function pedirJson<T>(p: PedidoJson<T>): Promise<T | null> {
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    if (p.metricas) p.metricas.enviosParaIA++;
    let info: InfoResposta = {};
    let bruto: string;
    try {
      bruto = await p.provedor.responder({
        sistema: p.sistema,
        mensagens: [{ papel: 'user', texto: p.mensagem }],
        // A segunda chance vem com mais folga: quase sempre a primeira falhou por ter sido cortada
        maxTokens: tentativa === 1 ? p.maxTokens : Math.round(p.maxTokens * 1.5),
        signal: p.signal,
        aoTerminar: (i) => {
          info = i;
        },
      });
    } catch (erro) {
      // Resposta 200 sem texto porque o teto acabou no raciocínio: vale a segunda tentativa, com mais folga
      if (erro instanceof ErroProvedorIA && erro.motivo === 'max_tokens' && tentativa === 1) {
        p.logger.warn({ rota: p.rota, tentativa, problema: 'cortada', ...info }, 'resposta da IA não aproveitada');
        continue;
      }
      throw erro;
    }
    try {
      return p.validar(extrairJson(bruto));
    } catch (erro) {
      const problema = info.motivo === 'max_tokens' ? 'cortada' : erro instanceof SyntaxError ? 'sem-json' : 'formato';
      p.logger.warn({ rota: p.rota, tentativa, problema, campos: camposComProblema(erro), ...info }, 'resposta da IA não aproveitada');
    }
  }
  return null;
}
