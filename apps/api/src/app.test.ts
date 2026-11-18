import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { criarApp } from './app.js';
import { carregarConfig } from './config.js';
import { criarLogger } from './logger.js';

const config = carregarConfig({ NODE_ENV: 'test', PSEUDONIMO_SEGREDO: 'x'.repeat(32), LIMITE_REQUISICOES_POR_MINUTO: '3', LOG_LEVEL: 'silent' });
const novaApp = () => criarApp(config, criarLogger('silent'));

describe('API — saúde e cabeçalhos', () => {
  it('GET /api/saude responde ok', async () => {
    const res = await request(novaApp()).get('/api/saude');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', servico: 'threshold-api' });
  });

  it('envia cabeçalhos de segurança e esconde a tecnologia do servidor', async () => {
    const res = await request(novaApp()).get('/api/saude');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
  });

  it('CSP restringe scripts à própria origem e não força https (para funcionar em localhost)', async () => {
    const csp = (await request(novaApp()).get('/api/saude')).headers['content-security-policy'] as string;
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('não libera CORS para outras origens', async () => {
    const res = await request(novaApp()).get('/api/saude').set('Origin', 'https://site-malicioso.exemplo');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('API — erros sem vazar detalhes', () => {
  it('rota inexistente devolve 404 em JSON', async () => {
    const res = await request(novaApp()).get('/api/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ erro: 'Rota não encontrada.' });
  });

  it('JSON malformado devolve 400 sem stack trace', async () => {
    const res = await request(novaApp()).post('/api/saude').set('Content-Type', 'application/json').send('{"quebrado":');
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).not.toMatch(/at |stack|SyntaxError/);
  });

  it('corpo acima de 100 kB devolve 413', async () => {
    const res = await request(novaApp())
      .post('/api/saude')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ texto: 'a'.repeat(110_000) }));
    expect(res.status).toBe(413);
  });
});

describe('API — limite de requisições', () => {
  it('responde 429 depois do limite configurado', async () => {
    const app = novaApp();
    for (let i = 0; i < 3; i++) expect((await request(app).get('/api/saude')).status).toBe(200);
    const bloqueada = await request(app).get('/api/saude');
    expect(bloqueada.status).toBe(429);
  });
});

describe('API servindo o site (WEB_DIST)', () => {
  const pasta = mkdtempSync(path.join(tmpdir(), 'threshold-web-'));
  mkdirSync(path.join(pasta, 'assets'));
  writeFileSync(path.join(pasta, 'index.html'), '<!doctype html><title>Threshold</title><div id="root"></div>');
  writeFileSync(path.join(pasta, 'assets', 'app-abc123.js'), 'console.log(1)');
  const appSite = () => criarApp({ ...config, LIMITE_REQUISICOES_POR_MINUTO: 1000, WEB_DIST: pasta }, criarLogger('silent'));

  it('serve o index.html na raiz e nas rotas do front', async () => {
    for (const rota of ['/', '/dossie', '/lantern']) {
      const res = await request(appSite()).get(rota);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.headers['cache-control']).toBe('no-cache');
    }
  });

  it('serve os arquivos do build com cache longo', async () => {
    const res = await request(appSite()).get('/assets/app-abc123.js');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/immutable/);
  });

  it('rotas /api inexistentes continuam em JSON, não viram página', async () => {
    const res = await request(appSite()).get('/api/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ erro: 'Rota não encontrada.' });
  });

  it('não deixa sair da pasta do site (path traversal)', async () => {
    const res = await request(appSite()).get('/..%2f..%2fetc%2fpasswd');
    expect(res.text).not.toMatch(/root:/);
  });
});

describe('Configuração', () => {
  it('não sobe sem o segredo de pseudonimização', () => {
    expect(() => carregarConfig({})).toThrow(/PSEUDONIMO_SEGREDO/);
  });
});
