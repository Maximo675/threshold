import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { neutralizarEtiqueta, type Metricas } from '../fortaleza/metricas.js';
import type { Logger } from '../logger.js';
import type { criarPseudonimizador } from '../security/pseudonimizar.js';
import { AGENTES, promptDoAgente, rotear, type ContextoAluno } from './agentes.js';
import type { RegraAbnt } from './base-abnt.js';
import { identidadesDemo } from './contexto-demo.js';
import { ErroProvedorIA, type InfoResposta, type ProvedorIA } from './provedores.js';
import { criarTratadorRecorte } from './recorte.js';

const Mensagem = z.object({
  papel: z.enum(['aluno', 'lantern']),
  texto: z.string().trim().min(1).max(4000),
});

export const Corpo = z.object({
  mensagens: z
    .array(Mensagem)
    .min(1)
    .max(20)
    .refine((ms) => ms.at(-1)?.papel === 'aluno', 'a última mensagem precisa ser do aluno')
    .refine((ms) => ms.reduce((t, m) => t + m.texto.length, 0) <= 12_000, 'conversa longa demais'),
});


interface Dependencias {
  provedor: ProvedorIA | null;
  pseudonimizador: ReturnType<typeof criarPseudonimizador>;
  regrasAbnt: RegraAbnt[];
  logger: Logger;
  limitePorMinuto: number;
  timeoutMs?: number;
  maxTokens?: number;
  /** Dossiê e orientadores no estado atual, para a Hotline e o Board responderem com o que está na tela. */
  contexto?: () => ContextoAluno;
  /** Contadores da tela Fortaleza (só números). */
  metricas?: Metricas;
}

/**
 * POST /api/lantern/mensagens — conversa com a Lantern (e, por trás, Archivist, Hotline ou Board).
 * Ordem das defesas: limite de uso → validação → roteador determinístico → pseudonimização de TUDO
 * que vai para a IA (prompt e mensagens) → chamada com tempo máximo → nomes devolvidos só na resposta ao aluno.
 */
export function criarRotaLantern(dep: Dependencias): Router {
  const rota = Router();
  const timeoutMs = dep.timeoutMs ?? 45_000;

  rota.get('/status', (_req, res) => {
    res.json({ online: dep.provedor !== null, agentes: Object.values(AGENTES).map((a) => a.nome) });
  });

  // Um só limite para conversa e Sala de Recorte: os dois gastam a mesma cota de IA
  const limite = rateLimit({
    windowMs: 60_000,
    limit: dep.limitePorMinuto,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Só respostas que chegaram ao aluno contam: erro de rede, de validação ou da IA não gasta a cota
    skipFailedRequests: true,
    handler: (req, res) => {
      if (dep.metricas) dep.metricas.bloqueiosPorLimite++;
      const reset = (req as typeof req & { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime;
      const segundos = reset ? Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 1000)) : 60;
      res.status(429).json({
        erro: `A Lantern precisa de um respiro. Você pode perguntar de novo em ${segundos} s.`,
        codigo: 'LIMITE_POR_MINUTO',
        tenteEmSegundos: segundos,
      });
    },
  });

  rota.post(
    '/mensagens',
    limite,
    async (req, res) => {
      const pedido = Corpo.safeParse(req.body);
      if (!pedido.success) {
        if (dep.metricas) dep.metricas.entradasRecusadas++;
        res.status(400).json({ erro: 'Mensagem inválida. Escreva entre 1 e 4.000 caracteres.' });
        return;
      }
      if (!dep.provedor) {
        res.status(503).json({
          erro: 'A Lantern está offline: falta configurar o provedor de IA no arquivo .env.',
          codigo: 'IA_NAO_CONFIGURADA',
        });
        return;
      }

      const { mensagens } = pedido.data;
      const ultima = mensagens.at(-1)!;
      const agente = rotear(ultima.texto);

      // Tudo que sai do servidor passa pela pseudonimização — inclusive o prompt (que cita professores).
      const mapa = new Map<string, string>();
      let substituicoes = 0;
      const proteger = (texto: string) => {
        const r = dep.pseudonimizador.pseudonimizar(texto, identidadesDemo);
        r.mapa.forEach((v, k) => mapa.set(k, v));
        substituicoes += r.substituicoes;
        return r.texto;
      };

      const sistema = proteger(promptDoAgente(agente, dep.regrasAbnt, dep.contexto?.()));
      const mensagensIA = mensagens.map((m) =>
        m.papel === 'aluno'
          ? { papel: 'user' as const, texto: `<mensagem_do_aluno>\n${proteger(neutralizarEtiqueta(m.texto, 'mensagem_do_aluno', dep.metricas))}\n</mensagem_do_aluno>` }
          : { papel: 'assistant' as const, texto: proteger(m.texto) },
      );
      const enviadoAIA = mensagensIA.at(-1)!.texto.replace(/^<mensagem_do_aluno>\n|\n<\/mensagem_do_aluno>$/g, '');

      if (dep.metricas) {
        dep.metricas.enviosParaIA++;
        dep.metricas.trechosProtegidos += substituicoes;
      }

      const controle = new AbortController();
      const relogio = setTimeout(() => controle.abort(), timeoutMs);
      const inicio = performance.now();
      try {
        let info: InfoResposta = {};
        const resposta = await dep.provedor.responder({
          sistema,
          mensagens: mensagensIA,
          // Folgado de propósito: o raciocínio interno do modelo gasta este mesmo teto. Com 700, a resposta
          // às vezes vinha vazia e a pessoa precisava enviar de novo (corrigido em 14/11/2026).
          maxTokens: dep.maxTokens ?? 2500,
          signal: controle.signal,
          aoTerminar: (i) => {
            info = i;
          },
        });
        dep.logger.info(
          { agente, provedor: dep.provedor.nome, ms: Math.round(performance.now() - inicio), substituicoes, ...info },
          'lantern respondeu',
        );
        res.json({
          agente,
          nomeAgente: AGENTES[agente].nome,
          texto: dep.pseudonimizador.restaurar(resposta, mapa),
          protecao: { enviadoAIA, substituicoes },
        });
      } catch (erro) {
        const tempoEsgotado = controle.signal.aborted;
        // Só metadados: o status HTTP do provedor ajuda a achar chave errada (401) ou falta de crédito (402/429); a mensagem nunca vai ao log
        const statusProvedor = erro instanceof ErroProvedorIA ? erro.status : undefined;
        const motivo = erro instanceof ErroProvedorIA ? erro.motivo : undefined;
        // Falha de rede (TypeError "fetch failed"): o código da causa diz se foi DNS, firewall ou certificado
        const causa = (erro as { cause?: { code?: string } })?.cause?.code;
        dep.logger.warn(
          { agente, provedor: dep.provedor.nome, tempoEsgotado, statusProvedor, motivo, causa, tipo: (erro as Error)?.name },
          'falha na IA',
        );
        res.status(tempoEsgotado ? 504 : 502).json({
          erro: tempoEsgotado
            ? 'A Lantern demorou demais para responder. Tente de novo.'
            : 'A Lantern não conseguiu responder agora. Tente de novo em instantes.',
        });
      } finally {
        clearTimeout(relogio);
      }
    },
  );

  rota.post('/recorte', limite, criarTratadorRecorte({ ...dep, timeoutMs: dep.timeoutMs ?? 90_000 }));

  return rota;
}
