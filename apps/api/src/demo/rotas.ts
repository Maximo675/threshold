import { Router, type Request, type RequestHandler, type Response } from 'express';
import { z } from 'zod';
import { ErroDemo, type EstadoDemo } from './estado.js';

/**
 * Rotas do dossiê, dos orientadores e do painel do orientador (montadas em /api).
 *
 * Demonstração sem login: qualquer pessoa na máquina pode agir como aluna ou como orientador.
 * Com login, cada rota passa a conferir o perfil de quem chama (está em SECURITY.md › Pendências).
 * Mesmo assim, as defesas de sempre valem aqui: validação de tudo que entra (zod), limites de tamanho,
 * respostas de erro sem detalhes internos e nenhum texto livre no log.
 */

const Id = z.string().regex(/^[a-z0-9-]{1,40}$/);
/** Texto livre do orientador: sem caracteres de controle, de 3 a 600 caracteres. */
const Texto = z
  .string()
  .transform((t) => t.replace(/[^\P{Cc}\n\r\t]/gu, '').trim()) // tira caracteres de controle, menos quebra de linha e tab
  .pipe(z.string().min(3).max(600));

const validar = <T extends z.ZodType>(esquema: T, valor: unknown): z.infer<T> => {
  const r = esquema.safeParse(valor);
  if (!r.success) throw new ErroDemo(400, 'Dados inválidos. Confira os campos e tente de novo.');
  return r.data;
};

/** Converte ErroDemo em resposta JSON com a mensagem para a pessoa; o resto segue para o tratador geral. */
const rota =
  (acao: (req: Request, res: Response) => unknown): RequestHandler =>
  (req, res, next) => {
    try {
      res.json(acao(req, res));
    } catch (erro) {
      if (erro instanceof ErroDemo) res.status(erro.status).json({ erro: erro.message });
      else next(erro);
    }
  };

export function criarRotasDemo(estado: EstadoDemo): Router {
  const r = Router();

  // ---------- Aluna ----------
  r.get('/dossie', rota(() => estado.dossie()));

  r.patch(
    '/dossie/checklist/:id',
    rota((req) => {
      const id = validar(Id, req.params.id);
      const { feito } = validar(z.object({ feito: z.boolean() }), req.body);
      return estado.alternarItem(id, feito);
    }),
  );

  r.post(
    '/dossie/pedido',
    rota((req) => estado.pedirOrientacao(validar(z.object({ orientadorId: Id }), req.body).orientadorId)),
  );
  r.delete('/dossie/pedido', rota(() => estado.cancelarPedido()));
  r.post('/dossie/revisao', rota(() => estado.enviarParaRevisao()));

  r.get('/orientadores', rota(() => ({ orientadores: estado.orientadores() })));

  // ---------- Orientador ----------
  r.get('/painel/:id', rota((req) => estado.painel(validar(Id, req.params.id))));

  r.post(
    '/painel/:id/pedidos/:pedidoId',
    rota((req) => {
      const id = validar(Id, req.params.id);
      const pedidoId = validar(z.coerce.number().int().positive(), req.params.pedidoId);
      const { aceitar } = validar(z.object({ aceitar: z.boolean() }), req.body);
      return estado.responderPedido(id, pedidoId, aceitar);
    }),
  );

  r.post(
    '/painel/:id/devolutivas',
    rota((req) => estado.enviarDevolutiva(validar(Id, req.params.id), validar(z.object({ texto: Texto }), req.body).texto)),
  );

  r.post(
    '/painel/:id/revisao',
    rota((req) => {
      const id = validar(Id, req.params.id);
      const corpo = validar(z.object({ decisao: z.enum(['aprovar', 'devolver']), texto: Texto.optional() }), req.body);
      return estado.revisarEtapa(id, corpo.decisao, corpo.texto);
    }),
  );

  r.post(
    '/painel/:id/lembretes',
    rota((req) => estado.enviarLembrete(validar(Id, req.params.id), validar(z.object({ orientandoId: Id }), req.body).orientandoId)),
  );

  // ---------- Demonstração ----------
  r.post('/demo/reiniciar', rota(() => estado.reiniciar()));

  return r;
}
