# Imagem única do Threshold: a API serve também o site (build do front).
# Base Debian (slim) em vez de Alpine: os binários nativos do Vite e do TypeScript 7 são testados em glibc.
# Uso normal:  docker compose up --build   →  http://localhost:8080

# ---------- Etapa 1: instala as dependências e compila ----------
FROM node:22-slim AS build
WORKDIR /app

# Primeiro só os package.json: assim o Docker reaproveita o cache do npm ci quando só o código muda.
# O lockfile do monorepo cita os dois apps, então os dois package.json precisam estar aqui.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# Algumas redes derrubam a conexão HTTPS do Node 22 com a Cloudflare (npm e Anthropic): o npm morre com
# "Exit handler never called!" e a Lantern com ECONNRESET. A correção é oferecer só a criptografia clássica
# (explicação completa em docker/tls-classico.cjs). Vale para o npm ci daqui e para a API lá embaixo.
COPY docker/tls-classico.cjs /etc/threshold/tls-classico.cjs
ENV NODE_OPTIONS=--require=/etc/threshold/tls-classico.cjs
# Além disso, contra internet instável: mais tentativas e tempo por download, menos conexões ao mesmo tempo,
# cache do npm entre builds e até 3 rodadas do npm ci antes de desistir.
ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_MAXSOCKETS=6 \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    CYPRESS_INSTALL_BINARY=0
RUN --mount=type=cache,target=/root/.npm \
    for tentativa in 1 2 3; do \
      npm ci && exit 0; \
      echo "npm ci falhou (tentativa $tentativa de 3), tentando de novo em 10 s..."; sleep 10; \
    done; exit 1

COPY apps apps
RUN npm run build -w web \
 && npm run build -w api \
 && npm prune --omit=dev

# ---------- Etapa 2: só o necessário para rodar ----------
FROM node:22-slim
ENV NODE_ENV=production \
    PORT=3333 \
    WEB_DIST=/app/web \
    NODE_OPTIONS=--require=/etc/threshold/tls-classico.cjs
COPY docker/tls-classico.cjs /etc/threshold/tls-classico.cjs
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist ./web
# Base de regras ABNT (RAG do Archivist). Só JSON público, sem dado pessoal.
COPY data/abnt/nbr6023-regras.json ./data/abnt/nbr6023-regras.json

# Nunca rodar como root dentro do contêiner
USER node
EXPOSE 3333
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3333/api/saude').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "apps/api/dist/server.js"]
