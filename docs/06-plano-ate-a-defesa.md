# Threshold — Plano até a defesa

> Versão 0.2 · 14/11/2026 · Maximo Di Giorgio
> Defesa prevista entre 02/12 e 07/12/2026. Entrega oficial em 16/12/2026.
> v0.2: as três salas que faltavam ficaram prontas em 14/11 (v0.8), 11 dias antes do planejado; entram o vídeo de 16/11 e a A3 de Usabilidade.

## O que os dados disseram até agora

Respostas reais em 14/11/2026: 5 alunos e 3 professores válidos (um quarto respondeu "Nunca orientei" e sai pelo critério do kit). É evidência exploratória, não estatística (o kit pedia 30 alunos e 5 professores).

| Achado | Números | O que muda no produto |
| --- | --- | --- |
| Escolher o tema é a maior dificuldade | 3 de 5 alunos (60%) | Nova **Sala de Recorte do tema**: a Lantern faz perguntas e ajuda a recortar o tema, sem escrever o trabalho |
| Formatação é o que mais pesa na ABNT | 4 de 5 (80%) | O Archivist continua no centro; o **Archivist em lote** revisa a lista inteira de referências |
| Todos já usam IA em trabalhos | 5 de 5 "frequentemente" | Reforça a proposta "a IA orienta, não escreve" como diferencial ético |
| Proteção de dados pesa na decisão | 5 de 5 com nota 4 ou 5 | O **Relatório da fortaleza** mostra a proteção funcionando para a banca |
| Usariam uma ferramenta de próximas etapas | 4 de 5 com nota 4 ou 5 | Hotline e lembrete de prazos ficam |
| Professores aceitam o perfil de afinidade | 2 de 3; 2 de 3 aceitam o resumo agregado de ex-orientandos | A ficha do orientador fica como está: sem ranking, só destaques agregados (H5 confirmada) |
| Professores também dão peso à proteção de dados | 3 de 3 | H6 confirmada nos dois grupos; a sala **Fortaleza** vira peça central da demonstração |
| Professores ainda não recomendariam a IA | 1 de 3 recomendaria; 2 neutros | H4 não confirmada. Maior receio: a IA escrever no lugar do aluno (2 de 3). Reforçar em toda tela e na fala da defesa que a Lantern **orienta e não escreve** |
| Onde o professor quer gastar menos tempo | Corrigir ABNT, explicar etapas e prazos, cobrar entregas atrasadas (um voto cada) | O **Painel do orientador** cobre os três: a revisão ABNT fica com o Archivist, o painel mostra a etapa de cada orientando e o lembrete sai pela Hotline |

Atenção para o texto do TCC: no formulário publicado, a pergunta da maior dificuldade é de escolha única e não existe a grade A3, então o H1 ("ABNT entre as maiores dores") saiu **não confirmado** pelo critério disponível. Isso é um resultado legítimo: mostra que a validação mudou o produto (Sala de Recorte). Conferir no Forms se "Aplicar as normas ABNT" estava entre as opções dessa pergunta.

## Cronograma

| Quando | Entrega | Situação |
| --- | --- | --- |
| 06/11 | Lantern estável na rede do celular (correção TLS, tentativas automáticas, limite amigável) | Pronto (v0.6.5) |
| 07/11 a 13/11 | Sala de Recorte do tema | Pronto (v0.7, 06/11): testes, acessibilidade e documentação; falta desenhar no Figma |
| 14/11 | Archivist em lote (sala Referências), com busca por DOI e ISBN em bases públicas | Pronto (v0.8) |
| 14/11 | Relatório da fortaleza (sala Fortaleza) | Pronto (v0.8) |
| 14/11 | Painel do orientador; Dossiê e Orientadores passam a gravar no servidor | Pronto (v0.8) |
| 14/11 | Atmosfera: textura de concreto, luz que segue o cursor, numeração de setor | Pronto (v0.8) |
| 14/11 | **Correção (v0.8.1)**, achada pelo Maximo no primeiro teste com a chave real: a Sala de Recorte falhava sempre com "a Lantern se embaralhou". Causa: o Claude Haiku 5.5 raciocina antes de responder e esse raciocínio gasta o mesmo teto de tokens; com teto de 1.100, o JSON chegava cortado. Tetos e tempos aumentados, segunda tentativa com mais folga, validação que aproveita o que veio certo, e log com o motivo da falha | Pronto; falta confirmar com a chave real |
| 15/11 | Atualizar na máquina, testar o roteiro do vídeo de ponta a ponta com a IA ligada | A fazer (Maximo e Nicole) |
| 16/11 | **Gravar o vídeo de 10 minutos** ([roteiro](07-roteiro-video.md)) | A fazer |
| 17/11 a 25/11 | Só ajustes vindos do ensaio e do orientador; entregar a A3 de Usabilidade no GitHub, com Bootstrap (v0.9, 18/11) e commits dos três integrantes ([checklist](08-a3-usabilidade-checklist.md)); desenhar as salas novas no Figma (opcional) | A fazer |
| 26/11 | **Congelamento do código**: daqui em diante só correção de erro | — |
| 26/11 a 01/12 | Roteiro da demonstração, ensaio cronometrado, gravação da demo em vídeo (plano B se a internet falhar), revisão do texto | A fazer |
| 02/12 a 07/12 | Defesa | — |

## O que ainda não foi testado fora do computador do Claude

Estas quatro coisas só dá para conferir na máquina de vocês. Façam no dia 15/11, antes de gravar:

1. `docker compose up -d --build` com a v0.8 (a imagem nova nunca foi construída de verdade).
2. Revisão em lote e Sala de Recorte com a chave real (aqui rodaram com uma IA simulada). O primeiro teste real, em 14/11, achou o erro do teto de tokens; a v0.8.1 corrige e precisa ser confirmada.
3. Busca por DOI e por ISBN (aqui a rede bloqueia a Crossref e a BrasilAPI; o código foi feito a partir do formato documentado das respostas e testado com respostas simuladas).
4. `npm run e2e` (o Cypress não instala aqui; o mesmo fluxo foi conferido com outro navegador automatizado).

## Regras para não se perder

- Cada funcionalidade só entra pronta: testes automáticos, acessibilidade verificada, documentação atualizada e no clima "arquivo paranormal" (sem nada da Remedy).
- Se uma etapa atrasar, a próxima encolhe; o congelamento de 26/11 não muda.
- Plano B da defesa: vídeo da demonstração gravado com antecedência e a plataforma rodando localmente, com internet do celular como reserva.
