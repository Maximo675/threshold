/*
 * Carregado antes de tudo pelo Node do contêiner (NODE_OPTIONS=--require=/etc/threshold/tls-classico.cjs),
 * inclusive pelo npm durante o build.
 *
 * Por quê: o Node 22 recente (OpenSSL 3.5) abre conexões HTTPS oferecendo também a troca de chaves
 * pós-quântica X25519MLKEM768. Isso deixa a primeira mensagem da conexão (ClientHello) com ~1,6 kB em vez
 * de ~0,35 kB, e algumas redes derrubam a conexão (ECONNRESET). Em 06/11/2026 isso bloqueou a Anthropic e o
 * registro do npm (os dois atrás da Cloudflare) dentro do Docker, enquanto o Google e o Windows funcionavam.
 * Uma configuração do OpenSSL (--openssl-config) não resolveu na máquina afetada; esta linha resolve,
 * porque é o valor padrão que todo tls.connect usa (fetch e npm incluídos).
 *
 * A conexão continua TLS 1.3 com X25519, o padrão atual da web; só deixa de oferecer a camada pós-quântica.
 * Para voltar ao padrão do Node, tire o NODE_OPTIONS do Dockerfile.
 */
require('node:tls').DEFAULT_ECDH_CURVE = 'X25519:P-256:P-384';
