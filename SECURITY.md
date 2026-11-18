# Segurança e privacidade no Threshold

O Threshold vai tratar dados de pessoas reais (alunos e professores). Estas regras valem para toda a equipe, em todo commit.

## Regras do repositório

1. **Nenhum dado real no Git.** Respostas de questionários, planilhas exportadas e prints com nomes ficam fora do repositório. O `.gitignore` já bloqueia `*.csv` (exceto os fictícios em `analise/fixtures/`), `resultados/` e `dados-reais/`.
2. **Nenhum segredo no Git.** Senhas, chaves de API e o `PSEUDONIMO_SEGREDO` ficam só no `.env` local e nos segredos do GitHub/servidor. Se um segredo vazar num commit, **troque o segredo** (apagar o commit não basta).
3. **Dados fictícios em desenvolvimento.** Exemplos usam pessoas, obras e editoras inventadas ("Editora Exemplo", "Exemplópolis").

## Regras do código

| Camada | Regra | Onde está |
| --- | --- | --- |
| Entrada | Corpo JSON limitado a 100 kB; validação de configuração na subida | `apps/api/src/app.ts`, `config.ts` |
| Cabeçalhos | Helmet (CSP, HSTS, nosniff, frameguard); sem `X-Powered-By` | `apps/api/src/app.ts` |
| Origem | Sem CORS: o front usa a mesma origem; origem cruzada é negada | `apps/api/src/app.ts` |
| Abuso | Limite de requisições por IP (429) | `apps/api/src/app.ts` |
| Erros | Respostas genéricas, sem stack trace | `apps/api/src/app.ts` |
| Logs | Só método, caminho, status e tempo; campos sensíveis com redact | `apps/api/src/logger.ts` |
| IA: dados | Nome, e-mail, CPF e telefone saem do texto (pergunta, histórico e contexto) antes de ir ao provedor; a resposta volta com os nomes restaurados só no servidor | `apps/api/src/security/pseudonimizar.ts`, `lantern/rota.ts` |
| IA: chave | A chave do provedor fica só no `.env` do servidor; o navegador fala apenas com `/api/lantern` | `apps/api/src/config.ts`, `lantern/provedores.ts` |
| IA: manipulação | Texto do aluno vai delimitado em `<mensagem_do_aluno>` (a tag é neutralizada se vier no texto); o prompt manda tratar o conteúdo como dado, não como ordem (OWASP LLM01/LLM07) | `apps/api/src/lantern/agentes.ts` |
| IA: custo e abuso | Limite próprio de mensagens por minuto, até 20 mensagens e 12.000 caracteres por conversa, resposta com teto de tokens (2.500 na conversa, 4.000 no Recorte, 8.000 na revisão em lote; a segunda tentativa usa 50% a mais) e tempo máximo (45 s, 90 s e 120 s) (OWASP LLM10). Os tetos são folgados porque o raciocínio interno do modelo conta neles | `apps/api/src/lantern/rota.ts` |
| IA: outras entradas | As fichas da Sala de Recorte e a lista de referências seguem o mesmo caminho: tarja, etiqueta própria (`<fichas_do_aluno>`, `<referencias_do_aluno>`), resposta em JSON validada antes de chegar à tela | `apps/api/src/lantern/recorte.ts`, `referencias/rota.ts` |
| IA: logs | O log registra agente, provedor, status HTTP, motivo da parada, tokens gastos e o nome dos campos que falharam na validação; nunca a pergunta nem a resposta | `apps/api/src/lantern/rota.ts` |
| Bases públicas | Crossref (DOI) e BrasilAPI (ISBN) são consultadas pelo **servidor**, nunca pelo navegador: a CSP continua só `'self'`. O endereço de destino é fixo e o DOI/ISBN é validado antes (sem SSRF); só o identificador sai, sem nenhum dado da pessoa; tempo máximo de 10 s, cache e limite de 30 consultas por minuto | `apps/api/src/referencias/rota.ts`, `abnt.ts` |
| Demonstração | As rotas do dossiê e do painel não têm login **de propósito** nesta versão: só trabalham com pessoas inventadas, guardadas na memória. Texto de devolutiva limitado a 600 caracteres e sem caracteres de controle; a devolutiva nunca entra no contexto enviado à IA | `apps/api/src/demo/estado.ts`, `demo/rotas.ts` |
| Autoverificação | A sala Fortaleza roda 8 verificações no servidor e 4 no navegador a cada abertura, e mostra contadores da sessão (envios à IA, trechos tarjados, bloqueios). Os contadores são números: nenhum texto é guardado | `apps/api/src/fortaleza/`, `apps/web/src/pages/Fortaleza.tsx` |
| Front | Fontes e Bootstrap servidos pelo próprio app, instalados pelo npm (sem Google Fonts nem CDN), então a CSP continua só `'self'`; dado tarjado nunca vai para o DOM | `apps/web/src` |
| Navegador | O armazenamento local guarda só preferências e marcas de tempo (sons e efeitos de luz ligados, abertura vista, dia em que a Hotline foi atendida, último perfil visto), nunca dado pessoal; sons sintetizados, sem arquivos de terceiros | `apps/web/src/hooks`, `components/ChamadaHotline.tsx` |
| TLS de saída | O Node do contêiner oferece só grupos clássicos (X25519, P-256, P-384) em vez de incluir o pós-quântico X25519MLKEM768, porque algumas redes derrubam a conexão com ele. Continua TLS 1.3; decisão revisável quando as redes acompanharem | `docker/tls-classico.cjs`, `Dockerfile` |
| Link temporário | Compartilhar a demonstração é por túnel manual, aberto e fechado por quem roda (nunca ligado por padrão); a porta local continua só em 127.0.0.1. Sem login, vale só para dados fictícios e só durante o teste | `docs/05-como-rodar-e-testar.md`, seção 7 |
| Contêiner | Roda como usuário sem privilégios; portas abertas só em 127.0.0.1; `.env`, CSV e `node_modules` fora da imagem | `Dockerfile`, `.dockerignore`, `docker-compose.yml` |

Cada regra acima tem teste automatizado. Mudou uma regra? Mude o teste junto.

## Pendências (antes de usar dados reais)

- [ ] Autenticação com MFA e controle de acesso por perfil (hoje qualquer pessoa na máquina abre o painel do orientador: aceitável só porque os dados são fictícios)
- [ ] Persistência em banco (hoje a demonstração vive na memória do servidor)
- [ ] Criptografia de campos sensíveis no banco
- [ ] Logs de auditoria de acesso a dados
- [ ] Varredura OWASP ZAP no CI
- [ ] RIPD (relatório de impacto à proteção de dados) e plano de resposta a incidentes (Resolução CD/ANPD nº 15/2024: comunicar em 3 dias úteis)

## Encontrou uma falha?

Não abra issue pública. Use o aviso privado do GitHub: aba **Security** do repositório → **Report a vulnerability**. Só a equipe vê.
