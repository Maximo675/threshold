# Threshold — Documentação resumida (A3)

> Atividade Avaliativa A3 · Usabilidade, Desenvolvimento Web, Mobile e Jogos Digitais · UniCuritiba · novembro de 2026
> Grupo: Maximo Di Giorgio, Nicole e Caroline (nomes completos e usuários do GitHub no [README](../README.md#a3-de-usabilidade))
> Versão da aplicação: v0.9 (18/11/2026)

## 1. Proposta

Quem faz o TCC pela primeira vez esbarra em três coisas: as normas ABNT, não saber qual é o próximo passo e escolher orientador sem informação. Do outro lado, o professor gasta tempo de orientação corrigindo formatação e cobrando prazos.

O **Threshold** é uma aplicação Web que guia a aluna e o orientador pelo TCC. Uma guia de IA, a **Lantern**, orienta sem escrever o trabalho no lugar do aluno. A aplicação mostra as etapas com checklist, revisa referências pela NBR 6023, ajuda a recortar o tema e conecta aluna e orientador num mesmo dossiê. Os dados pessoais saem "tarjados" antes de qualquer envio à IA.

A proposta foi validada com um questionário (5 alunos e 3 professores, evidência exploratória). O resultado mudou o produto: escolher o tema foi a maior dificuldade dos alunos, e daí nasceu a Sala de Recorte.

A identidade visual é de "arquivo confidencial": fundo de concreto, luz âmbar que segue o cursor, carimbos e tarjas. É um desenho próprio, inspirado no clima de jogos de mistério, sem nenhum nome, símbolo ou arquivo de terceiros.

## 2. Páginas e funcionalidades

São 8 páginas com navegação integrada pelo mesmo menu. Todas as funcionalidades conversam com a API; nada é tela estática.

| # | Página | Endereço | O que a pessoa faz | Responsável |
| --- | --- | --- | --- | --- |
| 00 | Briefing | `/` | Apresentação da plataforma e mapa com as 7 salas | Caroline |
| 01 | Dossiê | `/dossie` | Marca o checklist de cada etapa (fica salvo), vê prazos com contagem de dias, lê devolutivas do orientador, envia a etapa para revisão | Nicole |
| 02 | Sala de Recorte | `/recorte` | Preenche 5 fichas (interesse, problema, público, contexto, viabilidade) e a IA devolve 3 recortes de tema, com pergunta, risco e primeiro passo | Maximo |
| 03 | Referências | `/referencias` | Cola a lista de referências para a IA revisar pela NBR 6023; monta uma referência pelo **DOI** (Crossref) ou pelo **ISBN** (BrasilAPI); copia a lista em ordem alfabética, com o negrito | Maximo |
| 04 | Lantern | `/lantern` | Conversa com a guia de IA, que encaminha para três especialistas: ABNT, etapas e prazos, orientadores | Maximo |
| 05 | Orientadores | `/orientadores` | Lê as fichas de afinidade dos professores (sem ranking) e solicita orientação | Nicole |
| 06 | Fortaleza | `/fortaleza` | Testa a tarja com o próprio texto e vê 12 verificações de segurança rodando na hora | Caroline |
| 07 | Painel do orientador | `/painel` | Aceita ou recusa pedidos, acompanha orientandos, escreve devolutivas, aprova ou devolve etapas, pede lembrete de prazo | Nicole |

A aluna e o orientador enxergam o mesmo dossiê. O que um faz aparece na tela do outro em até 4 segundos, sem recarregar.

A divisão de responsabilidade por página é a combinada pelo grupo. Cada integrante responde por pelo menos 2 páginas, como pede o enunciado.

## 3. APIs utilizadas

| API | Tipo | Requisição | Onde aparece | O que a aplicação faz com os dados |
| --- | --- | --- | --- | --- |
| **Crossref** | Pública, de terceiros | `GET https://api.crossref.org/works/{doi}` | Referências → "Montar a referência" com um DOI | Lê autores, título, subtítulo, revista, volume, número, páginas, ano e DOI do artigo, e monta a referência no formato ABNT, com o destaque em negrito. Mostra avisos do que a base não informou (cidade, ano, autor) |
| **BrasilAPI** (ISBN) | Pública, de terceiros | `GET https://brasilapi.com.br/api/isbn/v1/{isbn}` | Referências → "Montar a referência" com um ISBN | Lê autores, título, subtítulo, editora, cidade e ano do livro, corrige títulos que vêm todos em maiúsculas e monta a referência ABNT. Avisa quando a base mistura tradutor com autor |
| **API do Threshold** | Própria, REST (Node + Express) | 21 rotas com `GET`, `POST`, `PATCH` e `DELETE`, por exemplo `GET /api/dossie` e `PATCH /api/dossie/checklist/:id` | Dossiê, Orientadores, Painel, Fortaleza | Guarda e devolve o estado do TCC: checklist, pedido de orientação, devolutivas, revisão de etapas, lembretes, relatório de segurança |
| **Anthropic** (modelo Claude Haiku) | De terceiros, com chave | `POST https://api.anthropic.com/v1/messages` | Lantern, Sala de Recorte, revisão da lista de referências | Recebe o texto já sem dados pessoais e devolve a resposta. Na Sala de Recorte e na revisão em lote, devolve JSON, que é validado antes de aparecer na tela |

As duas APIs públicas (Crossref e BrasilAPI) funcionam sem chave. A IA só funciona com uma chave no arquivo `.env`; sem ela, as outras páginas continuam funcionando normalmente.

O navegador chama a nossa API, e é a nossa API que chama a Crossref, a BrasilAPI e a IA. Isso tem três motivos: a chave da IA nunca chega ao navegador; a política de segurança do site (CSP) pode bloquear qualquer conexão com outros domínios; e a resposta bruta vira a referência pronta, com mensagens de erro claras em português ("DOI não encontrado na Crossref. Confira se digitou certo."). Dá para ver as requisições na aba **Rede** do DevTools (`/api/referencias/doi?doi=...`).

## 4. Bootstrap

A interface usa o **Bootstrap 5.3** (CSS) e o **React-Bootstrap** (componentes com comportamento: menu recolhível e modal). O tema em `apps/web/src/styles/bootstrap-tema.css` passa a paleta e as fontes do Threshold para as variáveis do Bootstrap (`--bs-*`), com o modo escuro do Bootstrap ligado (`data-bs-theme="dark"`).

| Recurso do Bootstrap | Onde está |
| --- | --- |
| Grade (`row`, `col-lg-8`, `col-lg-4`, `g-4`, `row-cols-*`) | Layout de todas as salas: duas colunas no computador, uma no celular. Mapa do Briefing: 1, 2 ou 4 colunas conforme a tela |
| Navbar com menu recolhível (`Navbar`, `Navbar.Toggle`, `Navbar.Collapse`, `navbar-nav`, `nav-link`) | Cabeçalho de todas as salas. Abaixo de 992 px, as abas viram um menu com botão ☰ |
| Botões (`btn`) com três variantes próprias (`btn-lantern`, `btn-arquivo`, `btn-alerta`) | Todos os botões (componente `Botao.tsx`) |
| Formulários (`form-control`, `form-label`, `form-check-input`) | Lantern, Referências, Fortaleza, Painel e checklist do Dossiê |
| Grupo de botões (`btn-group` + `btn-check`) | Referências: escolha entre DOI e ISBN |
| Cards (`card`) | Fichas, cartões laterais, pedidos, etapas em todas as salas |
| Modal (`Modal` do React-Bootstrap) | Confirmação antes de reiniciar a demonstração (Dossiê) e antes de recusar um pedido (Painel) |
| Barra de progresso (`progress`, `progress-bar`) | Dossiê: etapas concluídas |
| Lista (`list-group`, `list-group-item-action`) | Orientadores: outras fichas compatíveis |
| Abas em pílula (`nav-pills`) | Painel: escolha do professor da demonstração |
| Utilitários (`w-100`, `m-0`, `list-unstyled`) | Vários componentes |

## 5. Responsividade e usabilidade

A aplicação foi conferida em 1320 px (computador) e 390 px (celular), sem rolagem lateral em nenhuma página. A quebra principal é a do Bootstrap (`lg`, 992 px): as colunas empilham e o menu se recolhe.

| Critério do enunciado | Como a aplicação atende |
| --- | --- |
| Navegação intuitiva | O mesmo menu em todas as salas, com a aba atual marcada; mapa das salas no Briefing; cartão "Próximo passo" no Dossiê |
| Organização e hierarquia | Cada sala tem um título, um número de setor e uma ação principal em destaque (botão âmbar) |
| Consistência visual | Os mesmos componentes (Botão, Carimbo, Card, Tarja) e as mesmas cores em todas as páginas |
| Facilidade de uso | Exemplos prontos em cada sala ("Usar o exemplo"), botões que só ligam quando a ação é possível, confirmação antes de ações que desfazem trabalho |
| Clareza das informações | Situação sempre em texto (Aprovado, Em andamento, Atrasado), contagem de dias nos prazos, mensagens de erro em português com o que fazer |
| Diferentes dispositivos | Grade e menu responsivos do Bootstrap; alvos de toque de 44 px ou mais |

Acessibilidade: WCAG 2.2 AA conferida com a ferramenta axe em todas as páginas, no computador e no celular, sem nenhuma violação. A navegação funciona inteira pelo teclado e o foco aparece sempre, em âmbar. Com "reduzir movimento" no sistema, as animações param.

## 6. Tecnologias

React 19, TypeScript e Vite no front-end; Bootstrap 5.3 e React-Bootstrap na interface; Node.js e Express na API. Os testes usam Vitest e Testing Library (205 testes automáticos), Cypress e axe (ponta a ponta e acessibilidade). Docker é opcional.

## 7. Como rodar

Com o Node 22 instalado, na pasta do projeto:

```bash
npm install
npm run demo        # abre em http://localhost:8080
```

Para ligar a IA, crie o arquivo `.env` com a chave, como explica a seção 2 do guia [Como rodar e testar](05-como-rodar-e-testar.md). Para alterar o código e ver a mudança na hora: `npm run ao-vivo` (abre em http://localhost:5173).

## 8. Limitações conhecidas

- Não há login: a troca entre a visão da aluna e a do orientador é por um link. Por isso a aplicação usa só pessoas inventadas e não pode receber dados reais.
- Os dados da demonstração ficam na memória do servidor e voltam ao começo quando ele reinicia.
- As funções de IA precisam de chave e de internet; a busca por DOI e ISBN precisa de internet.
