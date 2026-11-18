# Threshold — A3 de Usabilidade: enunciado x entrega

> Versão 0.2 · 18/11/2026 · Maximo Di Giorgio
> v0.2: refeito a partir do enunciado oficial (antes era baseado em requisitos de conversa). O Bootstrap, exigido pelo enunciado, entrou na v0.9.
> Disciplina: Usabilidade, Desenvolvimento Web, Mobile e Jogos Digitais (UniCuritiba). Grupo: Maximo, Nicole e Caroline.
> O que o professor lê: [Documentação resumida](09-a3-documentacao-resumida.md). Este arquivo é o controle do grupo.

## 1. Requisito por requisito

| Item do enunciado | Pedido | Entregue | Situação |
| --- | --- | --- | --- |
| 1 · Objetivo | Aplicação Web funcional, front-end, tema livre, problema real | Plataforma de apoio ao TCC, validada com questionário (5 alunos, 3 professores) | Atende |
| 2 · Grupo | Até 4 integrantes; cada um com no mínimo 2 páginas | 3 integrantes, 8 páginas: Maximo 3, Nicole 3, Caroline 2 | Atende, se cada um confirmar as páginas dele (seção 3) |
| 3.1 · Páginas | No mínimo 4, com funcionalidade real, identidade e navegação integradas | 8 páginas, todas conversando com a API, mesmo menu e mesma identidade | Atende com folga |
| 3.2 · APIs | No mínimo 2 requisições, dados usados e apresentados na tela | Crossref (DOI) e BrasilAPI (ISBN) viram referência ABNT na tela; mais a API própria (21 rotas) e a IA | Atende com folga |
| 3.3 · Bootstrap | Usar o Bootstrap: grid, menus, botões, formulários, cards, modais; responsivo | Grade, navbar recolhível, botões, formulários, btn-group, cards, 2 modais, progress, list-group, nav-pills | Atende (v0.9) |
| 3.4 · UX | Navegação, hierarquia, consistência, facilidade, clareza, dispositivos | Ver seção 5 da documentação resumida; axe sem violações em 1320 e 390 px | Atende |
| 5.1 · Código no GitHub | Repositório com **commits de todos os integrantes** | Repositório público | **Falta**: commits da Nicole e da Caroline (seção 3) |
| 5.2 · Aplicação funcional | Páginas e funcionalidades disponíveis | `npm install` e `npm run demo` | Atende |
| 5.3 · Documentação resumida | Proposta, funcionalidades, APIs | [09-a3-documentacao-resumida.md](09-a3-documentacao-resumida.md) e README | Atende |
| 5.4 · Apresentação | Demonstração e **alterações pedidas na hora**, feitas pela equipe | `npm run ao-vivo` e o mapa da seção 4 | Ensaiar (seção 4) |
| 6 · Participação | Participação dos integrantes no desenvolvimento | Divisão de páginas no README e commits de cada um | Depende da seção 3 |

## 2. Subir para o GitHub (Maximo)

1. Em <https://github.com/new>, crie o repositório `threshold`, **público**, **sem** README, sem .gitignore e sem licença (o projeto já tem os dele).
2. Na pasta do projeto (PowerShell):

   ```powershell
   cd C:\dev\threshold
   git init
   git add .
   git status
   ```

   Confira a lista do `git status`: **não pode aparecer** `.env`, nem `node_modules`, nem nenhum `.csv` fora de `analise/fixtures`. O `.gitignore` já bloqueia isso. Se aparecer, pare e me avise.

3. Primeiro commit e envio (troque o usuário se não for o seu):

   ```powershell
   git commit -m "feat: Threshold v0.9 - plataforma do TCC e A3 de Usabilidade"
   git branch -M main
   git remote add origin https://github.com/Maximo675/threshold.git
   git push -u origin main
   ```

4. Convide a Nicole e a Caroline: no repositório, **Settings → Collaborators → Add people**. Elas precisam aceitar o convite que chega por e-mail.
5. Abra a aba **Actions** e espere os três trabalhos do CI. Se algum ficar vermelho, me mande o log antes de mandar o link ao professor. O trabalho de ponta a ponta (Cypress) nunca rodou fora do computador de vocês, então é o mais provável de precisar de ajuste.

## 3. Commits de todos os integrantes (Nicole e Caroline)

O enunciado pede commits de todos, e os commits precisam sair da conta de cada uma. Não dá para fazer por elas. O jeito mais simples não exige instalar nada:

1. Aceitar o convite do repositório.
2. No GitHub, abrir o `README.md`, clicar no lápis (**Edit this file**).
3. Na tabela "A3 de Usabilidade", preencher a própria linha: nome completo, usuário do GitHub e confirmar (ou trocar) as páginas pelas quais responde.
4. Clicar em **Commit changes**, com uma mensagem como `docs: dados e páginas da Nicole na A3`.

Isso cumpre a letra do enunciado, mas é um commit pequeno. O critério "participação dos integrantes" pesa mais se cada uma também fizer uma mudança de verdade numa página dela. Sugestões que cabem em 15 minutos e que o modo `npm run ao-vivo` mostra na hora:

| Quem | Página | Sugestão de alteração |
| --- | --- | --- |
| Nicole | Dossiê (`apps/web/src/pages/Dossie.tsx`) | Escrever o texto do cartão "Do seu orientador" quando ainda não há devolutiva, com as palavras dela |
| Nicole | Orientadores (`apps/web/src/pages/Orientadores.tsx`) | Revisar o texto de "Bom saber antes" ou da nota "Não existe ranking de professores" |
| Caroline | Briefing (`apps/web/src/pages/Briefing.tsx`) | Revisar os textos dos 3 pilares ou o resumo de cada sala no mapa |
| Caroline | Fortaleza (`apps/web/src/pages/Fortaleza.tsx`) | Revisar o texto de abertura ou trocar o texto de exemplo do teste da tarja (sempre com dados inventados) |

## 4. Preparação para as alterações pedidas na apresentação

O professor vai pedir mudanças na hora, e quem faz é a equipe. Cada um deve saber mexer nas próprias páginas.

**Antes da aula:** `npm install` e `npm run ao-vivo` no notebook da apresentação. O site abre em http://localhost:5173 e cada arquivo salvo aparece na tela na hora. Com o VS Code aberto ao lado, fica fácil.

**Onde fica cada coisa:**

| Quero mudar... | Arquivo |
| --- | --- |
| Texto, botão ou bloco de uma página | `apps/web/src/pages/<Página>.tsx` (Briefing, Dossie, Recorte, Referencias, Lantern, Orientadores, Fortaleza, Painel) |
| Abas do menu | `apps/web/src/components/Cabecalho.tsx` (lista `ABAS`) |
| Cores e fontes do site inteiro | `apps/web/src/styles/tokens.css` |
| Cores dos componentes do Bootstrap (botões, modal, lista) | `apps/web/src/styles/bootstrap-tema.css` |
| Botão padrão | `apps/web/src/components/Botao.tsx` |
| Janela de confirmação (modal) | `apps/web/src/components/Confirmacao.tsx` |
| Professores, alunos e etapas da demonstração | `apps/api/src/demo/estado.ts` (depois de mudar: `Ctrl + C` e `npm run ao-vivo` de novo) |
| Título de cada aba do navegador | `apps/web/src/App.tsx` |

**Pedidos prováveis e como responder:**

| Pedido | Como fazer |
| --- | --- |
| "Troca a cor principal" | Em `tokens.css`, mudar `--color-lantern` (e o `--bs-primary-rgb` em `bootstrap-tema.css`, se quiser o Bootstrap junto) |
| "Põe mais um item no menu" | Em `Cabecalho.tsx`, acrescentar `{ para: '/rota', rotulo: 'Nome' }` em `ABAS` |
| "Muda a proporção das colunas" ou "3 salas por linha no mapa" | Na grade do Bootstrap: trocar `col-lg-8` / `col-lg-4` por `col-lg-6` / `col-lg-6` na página, ou `row-cols-lg-4` por `row-cols-lg-3` no mapa do Briefing |
| "Acrescenta um campo no formulário" | Copiar um `<textarea className="form-control">` ou `<input className="form-control">` existente, com um `<label htmlFor>` próprio |
| "Mostra um aviso do Bootstrap" | `<div className="alert alert-warning" role="alert">Texto</div>` |
| "Usa outro componente do Bootstrap" | Os prontos para React estão em `react-bootstrap` (ex.: `import Badge from 'react-bootstrap/Badge'`) |

Depois de qualquer mudança na apresentação, se der tempo: `npm test` mostra na hora se algo quebrou.

## 5. Texto para colar na plataforma da faculdade

A plataforma da disciplina só aceita texto. Sugestão (troque o link pelo do repositório):

> **A3 · Usabilidade, Desenvolvimento Web, Mobile e Jogos Digitais**
> Grupo: Maximo Di Giorgio, Nicole e Caroline
> Repositório: https://github.com/Maximo675/threshold
>
> **Threshold** é uma aplicação Web que guia alunos e orientadores no TCC: etapas com checklist e prazos, revisão de referências pela ABNT, ajuda para recortar o tema, fichas de orientadores e um painel do orientador, com proteção de dados pessoais.
>
> São 8 páginas funcionais com Bootstrap 5.3 (grade, menu recolhível, botões, formulários, cards, modais, barra de progresso, list-group e nav-pills), responsivas e conferidas em computador e celular.
>
> APIs: Crossref (busca de artigo pelo DOI) e BrasilAPI (busca de livro pelo ISBN), cujos dados viram a referência no formato ABNT; a API REST própria da aplicação; e IA (Claude) para a guia Lantern.
>
> Documentação resumida: docs/09-a3-documentacao-resumida.md no repositório.
> Para rodar: `npm install` e `npm run demo` (Node 22), depois abrir http://localhost:8080.
