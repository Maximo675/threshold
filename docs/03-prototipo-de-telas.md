# Threshold — Protótipo de telas

> Versão 0.3 · 14/11/2026 · Maximo Di Giorgio
> v0.3: o código passou do Figma. São 7 salas funcionais além do Briefing; a tabela "No código" é a referência atual.
> **Versão principal no Figma:** [Threshold — Protótipo de telas](https://www.figma.com/design/RnBE9rMJzfdctWnUTZ7tBd) (time pessoal do Maximo, plano Starter). Para a parceira editar, convide-a pelo botão Share do arquivo.
> Versão de rascunho: canvas de design privado no claude.ai, com o mesmo nome.

## Arquivo no Figma

- **Página Telas:** as 4 telas (1280 px de largura, auto layout), ligadas como protótipo. O fluxo "Threshold · fluxo do aluno" começa no Briefing; botões, abas do cabeçalho e logo levam às telas certas. Para testar: botão Present (▶).
- **Página Fundação:** o design system do Threshold.
  - Variáveis de cor (coleção "Threshold", modo "Arquivo (escuro)"): `color/bg`, `surface`, `surface-raised`, `border`, `border-strong`, `locked`, `text`, `text-soft`, `text-muted`, `lantern`, `on-lantern`, `alert`.
  - Estilos de texto: Display XL/L/M (Plex Sans Condensed, caixa alta), Heading L/M/S, Body L/M/S/XS, Button, Mono Label/Body/Stamp/Wordmark.
  - Componentes: Logo, Botão (Primário/Secundário), Carimbo (Aprovado/Andamento/Alerta), Chip (Destaque/Contorno/Claro), Tarja (Claro/Bloqueado), Etapa (Aprovado/Atual/Classificado) e Cabeçalho (aba ativa Dossiê/Lantern/Orientadores). Textos editáveis pelas propriedades do componente.
- Todas as cores das telas estão ligadas às variáveis: trocar uma cor na Fundação atualiza todas as telas. Isso deixa a versão em modo claro a um passo (basta criar um segundo modo na coleção).

## O que existe

Quatro telas navegáveis (os links entre elas funcionam no modo Play), todas com **dados fictícios**:

| # | Tela | Arquivo no canvas | O que mostra |
| --- | --- | --- | --- |
| 1 | Briefing (primeiro acesso) | `Main.dc.html` | Boas-vindas, os 3 pilares da Lantern e o aviso de privacidade com dados tarjados |
| 2 | Dossiê do aluno | `Painel.dc.html` | Tema, progresso (2 de 6 etapas), etapas com carimbos (APROVADO, EM ANDAMENTO, CLASSIFICADO) e o próximo passo indicado pela Lantern |
| 3 | Lantern · Archivist (revisor ABNT) | `Revisor.dc.html` | Referência com 3 erros corrigida segundo a NBR 6023:2018, com explicação, e o painel "Proteção ativa" mostrando a pseudonimização |
| 4 | Ficha do orientador | `Orientador.dc.html` | Perfil de afinidade: áreas, estilo, vagas, destaques agregados e "por que ele aparece"; sem ranking |

Fluxo: Briefing → Dossiê → (Lantern ou Orientadores) → volta ao Dossiê.

### No código (`apps/web`)

Situação em 14/11/2026 (v0.8). Cada sala tem um número de setor, que aparece em marca-d'água no fundo.

| Setor · Tela | Rota | Situação |
| --- | --- | --- |
| 00 · Briefing | `/` | Pronta, com abertura "acessando arquivo", títulos que se revelam por trás da tarja e o **mapa do arquivo** com as 7 salas |
| 01 · Dossiê | `/dossie` | **Funcional**: vem da API. Checklist de cada etapa (marcar grava no servidor), cartão do próximo passo, prazos da Hotline, devolutivas do orientador, "Enviar para revisão" e carimbos Aprovado, Em andamento, Em revisão. Atualiza sozinho quando o orientador age |
| Chamada da Hotline | em todas as telas, menos o Briefing | Lembrete de prazo: telefone de disco tocando no canto, "Atender" mostra os prazos. Ainda não desenhada no Figma |
| 02 · Sala de Recorte | `/recorte` | Nova (06/11/2026), nascida da validação: 5 fichas num quadro de investigação; a Lantern "liga os fios" em 3 recortes de tema (pergunta, por que, risco, primeiro passo); "Puxar o fio" destaca as fichas ligadas; copiar para o orientador. Ainda não desenhada no Figma |
| 03 · Referências | `/referencias` | Nova (14/11/2026). **Archivist em lote**: cola até 12 referências e recebe cada uma com a situação (certa ou a corrigir), a regra da NBR 6023 e a versão corrigida. **Busca por DOI e ISBN** em bases públicas (Crossref e BrasilAPI), já no formato ABNT. Copiar tudo em ordem alfabética, com o negrito. Ainda não desenhada no Figma |
| 04 · Lantern | `/lantern` | Demo com IA real: Archivist, Hotline e Board, painel "Proteção ativa" e respostas em máquina de escrever. Aceita `?pergunta=` para chegar com a pergunta escrita |
| 05 · Ficha do orientador | `/orientadores` e `/orientadores/:id` | **Funcional**: abre a ficha de maior afinidade, troca de ficha pelos links ao lado; "Solicitar orientação" grava o pedido (aparece no painel do professor e no dossiê), dá para cancelar; depois do aceite a ficha mostra "Seu orientador". Atalho "Perguntar ao Board" |
| 06 · Fortaleza | `/fortaleza` | Nova (14/11/2026). **Teste a tarja**: a pessoa escreve um texto e vê o que sairia para a IA. 12 verificações de proteção rodando ao vivo (8 no servidor, 4 no navegador), contadores da sessão, configuração em uso e pendências assumidas. Ainda não desenhada no Figma |
| 07 · Painel do orientador | `/painel` e `/painel/:id` | Novo (14/11/2026). Seletor de professor (demonstração sem login), números do semestre, aceitar ou recusar pedido, orientandos com etapa e atraso, devolutiva por escrito, aprovar ou devolver a etapa em revisão, pedir lembrete à Hotline. Ainda não desenhado no Figma |

### Atmosfera (v0.8)

Pedido do Maximo em 14/11: trocar o fundo liso por textura e animações que reagem à pessoa. Tudo é desenho próprio, feito em CSS, sem imagem nem arquivo de terceiros.

| Elemento | Como é | Onde |
| --- | --- | --- |
| Concreto | Fundo com textura de concreto aparente e grão fino, em vez de cor chapada | `styles/atmosfera.css` |
| Luz da lanterna | Um halo âmbar segue o cursor pela página, como uma lanterna num arquivo escuro | `components/Ambiente.tsx` |
| Borda que acende | A borda dos cartões clareia do lado em que a luz está | `styles/atmosfera.css` |
| Setor | Número grande do setor em marca-d'água no canto de cada sala (00 a 07) | atributo `data-setor` em cada página |
| Controle | Botão "Efeitos de luz" no cabeçalho liga e desliga; com "reduzir movimento" no sistema, nada se mexe | `hooks/useEfeitos.ts` |

Referência de clima: arquitetura brutalista e arquivos confidenciais, na linha do que jogos como Control e Alan Wake evocam. **Nenhum nome, símbolo, fonte ou imagem da Remedy é usado.**

## Decisões de design

- Identidade própria do documento de visão (escolhida em 16/10/2026), sem reaproveitar design system de terceiros.
- Desde a v0.9 (18/11/2026), os componentes são construídos sobre o **Bootstrap 5.3**, exigência da A3 de Usabilidade. O tema (`apps/web/src/styles/bootstrap-tema.css`) aplica a paleta e as fontes do Threshold às variáveis do Bootstrap, então o visual continua o mesmo.
- Paleta: fundo `#0F0F12`, superfície `#1A1A1F`, texto `#ECE6D8`, secundário `#A8A39A`, Lantern `#F2B544`, alerta `#FF5C5C`.
- Tipografia: IBM Plex Sans Condensed (títulos), IBM Plex Sans (texto), IBM Plex Mono (rótulos, protocolos, carimbos).
- Logo provisório: um batente de porta com uma fresta de luz âmbar (o "limiar").
- Metáforas: o TCC é um dossiê; etapas futuras aparecem "classificadas" (tarjadas); dados pessoais aparecem tarjados.
- Acessibilidade: links e botões reais, alvos de toque de 44 px ou mais, contraste AA com a paleta do documento de visão.

## Próximos passos sugeridos

- Desenhar no Figma as salas que nasceram direto no código (Recorte, Referências, Fortaleza, Painel e a chamada da Hotline), reaproveitando os componentes da Fundação. É opcional para a defesa: o código é a referência.
- Versão em modo claro (papel): segundo modo na coleção de variáveis do Figma.
- Login com MFA (trabalho futuro).
