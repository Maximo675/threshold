import { criarApp } from './app.js';
import { carregarConfig } from './config.js';
import { criarLogger } from './logger.js';

const config = carregarConfig();
const logger = criarLogger(config.LOG_LEVEL);
const app = criarApp(config, logger);

const servidor = app.listen(config.PORT, () => {
  logger.info({ porta: config.PORT, ambiente: config.NODE_ENV }, 'Threshold API no ar');
});

// Encerramento limpo (Docker/Render mandam SIGTERM)
for (const sinal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sinal, () => {
    logger.info({ sinal }, 'encerrando');
    servidor.close(() => process.exit(0));
  });
}
