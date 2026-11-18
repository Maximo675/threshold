/**
 * Servidor dos testes ponta a ponta (npm run e2e).
 * Sobe a API de verdade servindo o build do site em http://localhost:4173, com um segredo descartável e sem IA.
 * Assim o Cypress testa a plataforma inteira: telas + API + estado da demonstração. As chamadas de IA são
 * simuladas nos próprios testes (cy.intercept), então nada sai para a internet e nenhum crédito é gasto.
 */
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

Object.assign(process.env, {
  NODE_ENV: 'production',
  PORT: '4173',
  LOG_LEVEL: 'warn',
  WEB_DIST: fileURLToPath(new URL('../apps/web/dist', import.meta.url)),
  PSEUDONIMO_SEGREDO: randomBytes(32).toString('hex'),
  LIMITE_REQUISICOES_POR_MINUTO: '5000', // os testes fazem muitas chamadas seguidas
  LLM_PROVEDOR: '',
  LLM_API_KEY: '',
  LLM_MODELO: '',
});

await import('../apps/api/dist/server.js');
