import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type ErrorRequestHandler, type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import type { Config } from './config.js';
import { criarEstadoDemo, type EstadoDemo } from './demo/estado.js';
import { criarRotasDemo } from './demo/rotas.js';
import { criarMetricas } from './fortaleza/metricas.js';
import { criarRotaFortaleza } from './fortaleza/rota.js';
import { carregarBaseAbnt } from './lantern/base-abnt.js';
import { criarProvedor, type ProvedorIA } from './lantern/provedores.js';
import { criarRotaLantern } from './lantern/rota.js';
import type { Logger } from './logger.js';
import { criarRotaReferencias } from './referencias/rota.js';
import { criarPseudonimizador } from './security/pseudonimizar.js';

export interface DependenciasApp {
  /** Provedor de IA. Se omitido, é montado a partir da configuração (null = Lantern offline). */
  provedor?: ProvedorIA | null;
  /** Estado da demonstração (dossiê, pedidos, devolutivas). Se omitido, começa do zero. */
  estado?: EstadoDemo;
  /** fetch das consultas a bases públicas (DOI e ISBN). Os testes trocam por um falso. */
  buscar?: typeof fetch;
}

/**
 * Monta a aplicação Express com as camadas de segurança do documento de visão.
 * - Helmet: cabeçalhos de segurança (CSP, HSTS, noSniff, frameguard...).
 * - Sem CORS: o front chama a API pela mesma origem (proxy do Vite em dev). Origem cruzada é negada por padrão.
 * - Limite de corpo de 100 kB e limite de requisições por IP.
 * - Erros nunca devolvem stack trace nem detalhes internos.
 */
export function criarApp(config: Config, logger: Logger, dependencias: DependenciasApp = {}): Express {
  const app = express();
  const metricas = criarMetricas();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        // Sem upgrade-insecure-requests: em http://localhost (Docker local) ele faria o navegador pedir
        // CSS/JS por https e a página quebraria. Em produção o HTTPS é garantido pelo HSTS e pelo proxy.
        directives: { upgradeInsecureRequests: null },
      },
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: config.LIMITE_REQUISICOES_POR_MINUTO,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_req, res) => {
        metricas.bloqueiosPorLimite++;
        res.status(429).json({ erro: 'Muitas requisições. Tente de novo em instantes.' });
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  // Log de acesso sem dados pessoais: método, caminho sem query, status e duração.
  app.use((req, res, next) => {
    const inicio = performance.now();
    res.on('finish', () => {
      logger.info({ metodo: req.method, caminho: req.path, status: res.statusCode, ms: Math.round(performance.now() - inicio) }, 'requisição');
    });
    next();
  });

  app.get('/api/saude', (_req, res) => {
    res.json({ status: 'ok', servico: 'threshold-api' });
  });

  const estado = dependencias.estado ?? criarEstadoDemo();
  const regrasAbnt = carregarBaseAbnt();
  if (regrasAbnt.length === 0) logger.warn('base ABNT não encontrada (data/abnt/nbr6023-regras.json): o Archivist vai responder sem as regras');
  const provedor = dependencias.provedor === undefined ? criarProvedor(config) : dependencias.provedor;
  const pseudonimizador = criarPseudonimizador(config.PSEUDONIMO_SEGREDO);
  app.use(
    '/api/lantern',
    criarRotaLantern({
      provedor,
      pseudonimizador,
      regrasAbnt,
      logger,
      limitePorMinuto: config.LIMITE_LANTERN_POR_MINUTO,
      contexto: () => estado.contextoParaIA(),
      metricas,
    }),
  );
  app.use(
    '/api/referencias',
    criarRotaReferencias({ provedor, pseudonimizador, regrasAbnt, logger, metricas, limitePorMinuto: config.LIMITE_LANTERN_POR_MINUTO, buscar: dependencias.buscar }),
  );
  app.use('/api/fortaleza', criarRotaFortaleza({ config, pseudonimizador, regrasAbnt, metricas, iaConfigurada: provedor !== null }));
  app.use('/api', criarRotasDemo(estado));

  // Qualquer outra rota /api que não existe: 404 em JSON
  app.use('/api', (_req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
  });

  // Site (build do front), quando WEB_DIST aponta para uma pasta com index.html
  const pastaWeb = config.WEB_DIST ? path.resolve(config.WEB_DIST) : undefined;
  if (pastaWeb && existsSync(path.join(pastaWeb, 'index.html'))) {
    const indice = path.join(pastaWeb, 'index.html');
    app.use(
      express.static(pastaWeb, {
        index: false,
        setHeaders: (res, arquivo) => {
          // Arquivos com hash no nome (pasta assets/) nunca mudam: cache longo. O resto, sempre revalida.
          res.setHeader('Cache-Control', arquivo.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache');
        },
      }),
    );
    // Rotas do React (/dossie, /lantern...): devolve o index.html e o roteador do front decide a tela
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indice);
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
  });

  const tratarErro: ErrorRequestHandler = (err, _req, res, _next) => {
    const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 500 ? err.status : 500;
    if (status === 500) logger.error({ tipo: err?.name ?? 'Error' }, 'erro inesperado');
    const mensagens: Record<number, string> = {
      400: 'Requisição inválida.',
      413: 'Conteúdo grande demais.',
      500: 'Erro interno. A equipe foi avisada.',
    };
    res.status(status).json({ erro: mensagens[status] ?? 'Requisição não pôde ser atendida.' });
  };
  app.use(tratarErro);

  return app;
}
