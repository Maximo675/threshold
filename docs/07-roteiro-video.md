# Threshold — Roteiro do vídeo de 10 minutos

> Versão 0.1 · 14/11/2026 · Maximo Di Giorgio
> Gravação: segunda-feira, 16/11/2026, Maximo e Nicole. Duração-alvo: 9min30 (meio minuto de folga).
> É um ponto de partida: troquem as falas pelas palavras de vocês. Os tempos e a ordem das telas são o que importa.

## A ideia em uma frase

"O Threshold guia o aluno e o orientador pelo TCC com IA que **orienta e não escreve**, e trata os dados das pessoas como um arquivo confidencial."

Se o vídeo inteiro só deixar essa frase na cabeça de quem assiste, deu certo.

## Antes de gravar (domingo, 15/11)

Façam o roteiro inteiro uma vez, cronometrando, **na máquina e na internet que vão usar**.

- [ ] Atualizar para a v0.8 e subir (`docker compose up -d --build` ou `npm run demo`)
- [ ] `http://localhost:8080/fortaleza` mostra "12 de 12 verificações aprovadas"
- [ ] IA respondendo: uma pergunta na Lantern, um "Ligar os fios" e uma revisão em lote
- [ ] Busca por DOI funcionando com `10.1145/3290605.3300233` (se falhar, tirem esse trecho do vídeo e usem só a revisão em lote)
- [ ] Som do computador sendo capturado pelo gravador (máquina de escrever e telefone fazem parte do efeito)
- [ ] Zoom do navegador em 110% ou 125%, janela em tela cheia, favoritos e outras abas escondidos
- [ ] Notificações do sistema desligadas

## Preparação da cena (5 minutos antes)

1. Abrir duas janelas do navegador: **janela A** (aluna) e **janela B** (orientador, em `/painel`). Deixar a B minimizada.
2. Na janela A, abrir `/dossie` e clicar em **"Reiniciar a demonstração"** no rodapé.
3. Fechar e abrir a janela A (ou usar janela anônima) para a abertura "Acessando arquivo" aparecer de novo.
4. Deixar copiado num bloco de notas, para colar sem digitar ao vivo:
   - DOI: `10.1145/3290605.3300233`
   - Pergunta para a Lantern: `Escreve a introdução do meu TCC?`
   - Devolutiva do orientador: `Ana, o recorte ficou bom. Antes de avançar, delimite melhor o público da pesquisa.`
5. **Nunca mostrar na gravação:** o arquivo `.env`, o terminal com a chave, as planilhas de respostas reais.

## Roteiro

Quem fala é sugestão; dividam como ficar natural. Uma pessoa fala enquanto a outra opera a tela.

| Tempo | Tela | O que mostrar | Fala (ideia) |
| --- | --- | --- | --- |
| 0:00 – 0:40 | Rosto ou slide de título | Nome do projeto, nomes de vocês, curso | "Quem faz TCC pela primeira vez esbarra em três coisas: norma ABNT, não saber o próximo passo e escolher orientador no escuro. E do outro lado o professor gasta tempo de orientação corrigindo vírgula de referência. O Threshold nasceu para isso." |
| 0:40 – 1:25 | Slide com 4 números | 3 de 5 alunos: escolher o tema é o mais difícil · 4 de 5: formatação é o que mais pesa na ABNT · 5 de 5 já usam IA · proteção de dados pesa para 100% dos alunos e dos professores | "Antes de construir, perguntamos. Responderam 5 alunos e 3 professores: é pouco, é evidência exploratória, mas mudou o produto. Esperávamos que ABNT fosse a maior dor; foi escolher o tema. Por isso existe a Sala de Recorte." |
| 1:25 – 2:00 | Briefing `/` | Abertura "Acessando arquivo", título surgindo da tarja, mover o mouse devagar para a luz aparecer, mapa do arquivo | "O TCC aqui é um dossiê confidencial que você vai desclassificando. A identidade é nossa, inspirada no clima de arquivo secreto. A luz que segue o cursor é a Lantern, a guia de IA." |
| 2:00 – 2:50 | Dossiê `/dossie` | Atender a Hotline quando tocar; carimbos; marcar 1 item do checklist; cartão "Próximo passo" | "Seis etapas, cada uma com checklist. A plataforma sempre diz qual é o próximo passo. E quando um prazo chega perto, a Hotline liga." |
| 2:50 – 3:50 | Sala de Recorte `/recorte` | "Preencher com o exemplo da Ana" → "Ligar os fios" → "Puxar o fio" de um recorte | "A maior dor dos alunos. A Lantern não inventa um tema: ela pega o que a aluna escreveu e devolve três recortes possíveis, cada um com pergunta, risco e primeiro passo, para levar ao orientador." |
| 3:50 – 5:00 | Referências `/referencias` | "Usar a lista de exemplo" → "Revisar com o Archivist" → abrir um item com erro → colar o DOI → "Montar a referência" → "Copiar a lista corrigida" | "O Archivist revisa a lista inteira pela NBR 6023 e explica cada correção com a regra. E se o artigo tem DOI ou o livro tem ISBN, a referência vem pronta de bases públicas, a Crossref e a BrasilAPI." |
| 5:00 – 5:45 | Lantern `/lantern` | Colar "Escreve a introdução do meu TCC?"; mostrar a recusa; apontar o painel "Proteção ativa" | "O maior receio dos professores foi a IA escrever no lugar do aluno. Então testamos ao vivo: ela recusa e oferece um roteiro. A IA orienta, não escreve." |
| 5:45 – 7:25 | Orientadores `/orientadores` e Painel `/painel`, **duas janelas lado a lado** | A: "Solicitar orientação". B: aceitar o pedido, colar a devolutiva e enviar. A: a devolutiva aparece sozinha e a etapa vira "Aprovado". B: "Pedir lembrete à Hotline" para a orientanda atrasada | "Não existe ranking de professor: a ficha mostra afinidade com o tema e só destaques agregados. A aluna pede, o professor aceita, e os dois enxergam o mesmo dossiê. Os professores disseram que querem gastar menos tempo corrigindo ABNT, explicando etapas e cobrando atraso: o painel cobre os três." |
| 7:25 – 8:35 | Fortaleza `/fortaleza` | "Usar o exemplo" → "Aplicar a tarja" (nome e e-mail viram código, CPF e telefone somem); placar 12 de 12; abrir um "Como testamos"; rolar até "O que falta antes de usar dados reais" | "Antes de qualquer texto ir para a IA, nome e e-mail viram código, CPF e telefone são removidos. Essas doze verificações rodam agora, na frente de vocês. E mostramos também o que ainda falta, como login com dois fatores: por isso hoje só existem pessoas inventadas na plataforma." |
| 8:35 – 9:15 | Slide ou editor de código | Stack: React, Node, TypeScript, Docker · 205 testes automáticos · acessibilidade WCAG 2.2 AA sem violações · mostrar a tela no tamanho de celular por 5 s | "Por baixo: React e Node com TypeScript, Bootstrap na interface, 205 testes automáticos, acessibilidade conferida em todas as telas, no computador e no celular." |
| 9:15 – 9:30 | Rosto ou Briefing | Encerramento | "O Threshold é o limiar entre o caos e o TCC entregue. A Lantern ilumina cada passo. Obrigado." |

## Se algo falhar durante a gravação

| Falha | O que fazer |
| --- | --- |
| A IA demora ou responde "não conseguiu responder agora" | Esperar 5 segundos e enviar de novo; a plataforma já tenta sozinha duas vezes. Cortar a espera na edição |
| A IA não volta de jeito nenhum | Gravar primeiro as partes sem IA (Dossiê, Orientadores, Painel, Fortaleza) e gravar as de IA depois, em outra rede |
| Busca por DOI falha | Mostrar só a revisão em lote e citar a busca em uma frase |
| O telefone não toca ao entrar no Dossiê | Clicar em "Simular ligação da Hotline" no cartão de prazos |
| A demonstração ficou "suja" de uma tentativa anterior | "Reiniciar a demonstração" no rodapé do Dossiê |
| Passou de 10 minutos | Encurtar primeiro a Lantern (a recusa aparece em 20 s) e o slide da stack |

## Depois de gravar

- [ ] Assistir inteiro com som e conferir se nenhum dado real, chave ou e-mail pessoal aparece
- [ ] Guardar uma cópia: este vídeo também serve de **plano B da defesa**, se a internet falhar no dia
- [ ] Conferir se o formato e a duração batem com o que foi pedido (TCC e A3 podem pedir entregas diferentes)
