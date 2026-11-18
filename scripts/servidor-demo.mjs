/**
 * Roda a plataforma inteira SEM Docker (npm run demo): a API de verdade servindo o site em http://localhost:8080.
 * Pensado para quem só quer ver funcionando (avaliação da disciplina, parceira de TCC, banca).
 *
 * - Se existir um arquivo .env na raiz, ele é lido (é onde fica a chave da IA). Sem .env, tudo funciona
 *   e só as funções de IA aparecem como "offline".
 * - O segredo dos pseudônimos é gerado na hora se não houver um no .env.
 * - Aplica a mesma correção de rede da imagem Docker (docker/tls-classico.cjs), para a IA e as bases públicas
 *   funcionarem também em internet de celular.
 *
 * Modo de edição ao vivo (npm run ao-vivo): para a apresentação da A3, quando o professor pede uma alteração.
 * Sobe a API na porta 3333 e o site pelo Vite em http://localhost:5173: cada arquivo salvo aparece na tela na hora,
 * sem recompilar. Tudo num terminal só; Ctrl + C para os dois.
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import tls from 'node:tls';
import { fileURLToPath } from 'node:url';

const raiz = (caminho) => fileURLToPath(new URL(`../${caminho}`, import.meta.url));

if (existsSync(raiz('.env'))) process.loadEnvFile(raiz('.env'));
tls.DEFAULT_ECDH_CURVE = 'X25519:P-256:P-384';

const aoVivo = process.argv.includes('--ao-vivo');

if (!existsSync(raiz('apps/api/dist/server.js')) || (!aoVivo && !existsSync(raiz('apps/web/dist/index.html')))) {
  console.error('Falta compilar o projeto. Rode:  npm run demo   (ele compila e sobe), ou  npm run build');
  process.exit(1);
}

process.env.NODE_ENV = 'production';
process.env.LOG_LEVEL ||= 'warn';
// Só na sua máquina: as telas se atualizam a cada 4 s, e duas janelas lado a lado (aluna e orientador)
// chegariam perto do limite padrão de 60 por minuto no meio de uma apresentação
process.env.LIMITE_REQUISICOES_POR_MINUTO ||= '300';
if (aoVivo) {
  process.env.PORT = '3333'; // é para onde o Vite encaminha /api (apps/web/vite.config.ts)
} else {
  process.env.PORT ||= '8080';
  process.env.WEB_DIST = raiz('apps/web/dist');
}
if (!process.env.PSEUDONIMO_SEGREDO || process.env.PSEUDONIMO_SEGREDO.length < 32) process.env.PSEUDONIMO_SEGREDO = randomBytes(32).toString('hex');
// O banco só existe no Docker e a demonstração não usa: a URL do .env.example não pode atrapalhar
delete process.env.DATABASE_URL;

await import('../apps/api/dist/server.js');

if (aoVivo) {
  // O site pelo Vite, com recarga instantânea. No Windows o npm é um .cmd, por isso o shell.
  const vite = spawn('npm', ['run', 'dev', '-w', 'web', '--', '--port', '5173', '--strictPort'], {
    cwd: raiz(''),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const parar = () => {
    vite.kill();
    process.exit(0);
  };
  process.on('SIGINT', parar);
  process.on('SIGTERM', parar);
  vite.on('exit', (codigo) => process.exit(codigo ?? 0));
  console.log('\n  Modo de edição ao vivo\n  Abra: http://localhost:5173  (salvou um arquivo em apps/web/src, a tela muda na hora)\n  API:  http://localhost:3333/api/saude\n  Para parar: Ctrl + C\n');
} else {
  console.log(`\n  Threshold no ar:  http://localhost:${process.env.PORT}\n  IA: ${process.env.LLM_API_KEY || process.env.LLM_PROVEDOR === 'openai' ? 'configurada pelo .env' : 'desligada (sem .env): as salas sem IA funcionam normalmente'}\n  Para parar: Ctrl + C\n`);
}
