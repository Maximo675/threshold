# Threshold

> **A Lantern ilumina cada passo do seu TCC.**
> Plataforma com agentes de IA que guia alunos e orientadores no TCC: normas ABNT, etapas do trabalho e escolha de orientador por afinidade, com proteção de dados desde o desenho.
> TCC de Engenharia de Software · UniCuritiba · entrega em dezembro de 2026.
> Também é a **A3 de Usabilidade, Desenvolvimento Web, Mobile e Jogos Digitais** (veja abaixo).

## A3 de Usabilidade

| Integrante | Usuário no GitHub | Páginas pelas quais responde |
| --- | --- | --- |
| Maximo Di Giorgio | [@Maximo675](https://github.com/Maximo675) | Sala de Recorte, Referências, Lantern |
| Nicole (preencher o nome completo) | (preencher) | Dossiê, Orientadores, Painel do orientador |
| Caroline (preencher o nome completo) | (preencher) | Briefing, Fortaleza |

- **Documentação resumida** (proposta, funcionalidades, APIs, Bootstrap): [docs/09-a3-documentacao-resumida.md](docs/09-a3-documentacao-resumida.md)
- **APIs**: Crossref (artigo pelo DOI) e BrasilAPI (livro pelo ISBN), que viram referência ABNT na tela; API REST própria; IA (Claude).
- **Bootstrap 5.3** + React-Bootstrap: grade, menu recolhível, botões, formulários, cards, modais, barra de progresso, list-group e nav-pills, com o tema do Threshold em [`bootstrap-tema.css`](apps/web/src/styles/bootstrap-tema.css).
- **Para rodar**: `npm install` e `npm run demo` (Node 22), depois http://localhost:8080.

## Estado atual (protótipo)

| Parte | Situação |
| --- | --- |
| Documento de visão, kit de validação | Prontos em [`docs/`](docs/) |
| Telas e design system | No Figma: [Threshold — Protótipo de telas](https://www.figma.com/design/RnBE9rMJzfdctWnUTZ7tBd) |
| Front-end (`apps/web`) | **7 salas funcionais** além do Briefing: Dossiê, Sala de Recorte, Referências, Lantern, Orientadores, Fortaleza e Painel do orientador. Todas conversam com a API, com textura, luz que segue o cursor e animações de "arquivo". Componentes sobre o **Bootstrap 5.3** (desde a v0.9) |
| API (`apps/api`) | Base segura (cabeçalhos, limites, erros sem vazamento), pseudonimização, **Lantern com IA real** (Claude, OpenAI ou Ollama, testada pela equipe com Claude Haiku em 19/10/2026), API REST do dossiê e do painel, consulta a **bases públicas** (Crossref e BrasilAPI) e **relatório da fortaleza** |
| Dados | Demonstração com pessoas inventadas, guardada na memória do servidor (reinicia junto com ele). Sem login e sem banco nesta versão |
| Base ABNT da Lantern (`data/abnt`, `docs/abnt`) | 23 regras da NBR 6023:2018 com exemplos próprios e 33 casos de teste |
| Análise da validação (`analise/`) | Script pronto para as respostas dos questionários, nos formatos do kit e do formulário publicado; descarta colunas que identificam pessoas |

## Os agentes

| Agente | Papel | Como funciona hoje |
| --- | --- | --- |
| **Lantern** | Guia e voz da plataforma | Recebe a pergunta e chama o especialista certo |
| **Archivist** | Normas ABNT | Responde com base nas 23 regras de `data/abnt` (RAG) e cita o id da regra. Na sala **Referências**, revisa a lista inteira de uma vez e monta a referência a partir do DOI ou do ISBN |
| **Hotline** | Etapas e prazos | Lê o dossiê do aluno e diz o próximo passo; "liga" (telefone de disco, com som) quando um prazo está a 14 dias ou menos; o orientador pode pedir um lembrete pelo painel |
| **Board** | Orientação | Compara o tema com as fichas dos orientadores, sem ranking |

## As salas

| Setor | Sala | Rota | O que a pessoa faz |
| --- | --- | --- | --- |
| 00 | Briefing | `/` | Apresentação e mapa do arquivo |
| 01 | Dossiê | `/dossie` | Marca o checklist de cada etapa, vê prazos e devolutivas, envia a etapa para revisão |
| 02 | Sala de Recorte | `/recorte` | Preenche 5 fichas e a Lantern liga os fios em 3 recortes de tema |
| 03 | Referências | `/referencias` | Cola a lista de referências para revisão em lote; busca por DOI (Crossref) e ISBN (BrasilAPI); copia em ordem alfabética com o negrito |
| 04 | Lantern | `/lantern` | Conversa com o Archivist, a Hotline e o Board |
| 05 | Orientadores | `/orientadores` | Lê as fichas de afinidade e solicita orientação |
| 06 | Fortaleza | `/fortaleza` | Testa a tarja com o próprio texto e vê 12 verificações de proteção rodando ao vivo |
| 07 | Painel do orientador | `/painel` | Aceita pedidos, acompanha orientandos, escreve devolutivas, aprova etapas, pede lembrete à Hotline |

A aluna e o orientador enxergam o mesmo dossiê: o que um faz aparece na tela do outro em até 4 segundos, sem recarregar.

Na **Sala de Recorte**, a Lantern ajuda a recortar o tema: o aluno preenche fichas num quadro de investigação e recebe 3 recortes possíveis para discutir com o orientador. Ela nasceu da validação: escolher o tema foi a maior dificuldade dos alunos.

Para ligar a IA, veja a seção 2 de [Como rodar e testar](docs/05-como-rodar-e-testar.md). Sem chave, a plataforma abre e a Lantern aparece offline.

## Estrutura

```
threshold/
├── apps/
│   ├── web/          React + Vite + TypeScript + Bootstrap (telas, componentes, testes Vitest e Cypress + axe)
│   └── api/          Node + Express + TypeScript (segurança, pseudonimização, testes Vitest + Supertest)
├── data/abnt/        Base de conhecimento da Lantern em JSON + casos de teste + validador
├── docs/             Documentação do projeto (visão, validação, protótipo, regras ABNT)
├── analise/          Script Python que analisa as respostas dos questionários
├── scripts/          Apps Script dos formulários; servidores de demonstração e de e2e
├── Dockerfile          Imagem única: API + site, usuário sem privilégios, healthcheck
├── docker-compose.yml  App em localhost:8080 + PostgreSQL com pgvector
└── .github/workflows/  CI: lint, tipos, testes, build, auditoria, e2e com acessibilidade, base ABNT e análise
```

## Como rodar

**Sem Docker** (Node 22+; o jeito mais simples para avaliar):

```bash
npm install
npm run demo                # compila e abre em http://localhost:8080
```

Sem arquivo `.env`, tudo funciona menos as três funções que dependem de IA (conversa com a Lantern, Sala de Recorte e revisão em lote), que aparecem como offline.

**Com Docker** (igual ao ambiente da defesa):

```bash
cp .env.example .env        # e preencha os dois segredos (comandos no guia abaixo)
docker compose up --build   # depois abra http://localhost:8080
```

Guia completo, com comandos para Windows, roteiro de teste e problemas comuns: [docs/05-como-rodar-e-testar.md](docs/05-como-rodar-e-testar.md).

**Edição ao vivo** (Node 22+; a tela muda a cada arquivo salvo, sem Docker):

```bash
npm install
npm run ao-vivo             # http://localhost:5173
```

**Modo desenvolvimento com banco** (dois terminais):

```bash
npm install
docker compose up -d db   # só o banco
npm run dev:api           # http://localhost:3333/api/saude
npm run dev:web           # http://localhost:5173  (chamadas /api vão para a API pelo proxy do Vite)
```

Na imagem Docker, a API também serve o site (variável `WEB_DIST`), então tudo roda num endereço só.

## Qualidade

| Comando | O que faz |
| --- | --- |
| `npm test` | 205 testes: web (componentes, menu, modais e as 7 salas com API simulada) e API (segurança, pseudonimização, agentes com IA simulada, dossiê, painel, referências e fortaleza) |
| `npm run lint` | oxlint, com as regras de acessibilidade `jsx-a11y` no front |
| `npm run typecheck` | TypeScript estrito nos dois apps |
| `npm run e2e` | Cypress no build de produção com a API de verdade: fluxo aluna → orientador → aluna, Referências, Fortaleza, conversa com a Lantern (IA simulada) e checagem WCAG 2.2 AA com axe |
| `python3 -I data/abnt/validar_base.py` | Consistência da base ABNT (ids, casos, regras citadas) |
| `python3 -m pytest analise/tests` | Testes do script de análise |

Tudo isso roda no GitHub Actions a cada push ([`ci.yml`](.github/workflows/ci.yml)).

## Princípios

1. **A IA orienta, não escreve.** A Lantern aponta e explica; o texto é do aluno.
2. **Fortaleza de dados.** Coletar pouco, pseudonimizar antes da IA, nunca logar dado pessoal. Veja [`SECURITY.md`](SECURITY.md).
3. **Primeiro acesso sem medo.** WCAG 2.2 AA verificada automaticamente; o clima de arquivo confidencial nunca atrapalha a instrução.
4. **Identidade própria.** O clima de arquivo confidencial é inspiração; nenhum nome, símbolo ou arquivo de jogos de terceiros entra no projeto.
5. **Animação com respeito.** Toda animação some com "reduzir movimento", nada pisca mais de 3 vezes por segundo e o leitor de tela recebe o texto inteiro, nunca letra por letra.

## Documentação

- [Documento de visão](docs/01-documento-de-visao.md)
- [Kit de validação](docs/02-kit-de-validacao.md)
- [Protótipo de telas](docs/03-prototipo-de-telas.md)
- [Como rodar e testar](docs/05-como-rodar-e-testar.md)
- [Plano até a defesa](docs/06-plano-ate-a-defesa.md)
- [Roteiro do vídeo de 10 minutos](docs/07-roteiro-video.md)
- [A3 de Usabilidade: enunciado x entrega](docs/08-a3-usabilidade-checklist.md)
- [A3 de Usabilidade: documentação resumida](docs/09-a3-documentacao-resumida.md)
- [Base ABNT da Lantern](docs/abnt/README.md)
- [Como contribuir](CONTRIBUTING.md)
