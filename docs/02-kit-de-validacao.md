# Threshold — Kit de Validação

> Versão 0.2 · 16/10/2026 · Maximo Di Giorgio
> v0.3: script que cria os formulários; P1 dos professores isolada na Seção 1.
> v0.2: projeto renomeado de Black Box para Threshold.
> Cópia versionada do documento vivo. Edições de conteúdo devem ser feitas primeiro no doc compartilhado e depois sincronizadas aqui.

## Sumário

1. [Plano de validação](#plano-de-validação)
2. [Texto de abertura e consentimento](#texto-de-abertura-e-consentimento)
3. [Questionário para alunos](#questionário-para-alunos)
4. [Questionário para professores](#questionário-para-professores)
5. [Como montar no Google Forms](#como-montar-no-google-forms)
6. [Como analisar](#como-analisar)
7. [Checklist de execução](#checklist-de-execução)

---

## Plano de validação

Dois questionários anônimos no Google Forms, um para alunos e outro para professores, aplicados de 19 a 28 de outubro. O objetivo é confirmar, com números, quais dores o protótipo deve atacar primeiro e se professores aceitam o perfil de afinidade.

**Hipóteses a testar:**

| # | Hipótese | Quem responde |
| --- | --- | --- |
| H1 | Normas ABNT estão entre as maiores dificuldades do TCC | Alunos e professores |
| H2 | O aluno não sabe qual é o próximo passo do TCC | Alunos |
| H3 | A escolha do orientador acontece sem informação suficiente | Alunos |
| H4 | Alunos e professores aceitam uma IA que orienta e confere, mas não escreve | Alunos e professores |
| H5 | Professores aceitam ter um perfil de afinidade com feedback anônimo e agregado | Professores |
| H6 | Segurança dos dados pesa na decisão de usar a plataforma | Alunos e professores |

**Público e meta de respostas:**

- **Alunos:** quem está fazendo ou vai fazer TCC nos próximos semestres, de qualquer curso da UniCuritiba. Meta: 30 respostas ou mais.
- **Professores:** quem orienta ou já orientou TCC. Meta: 5 respostas ou mais.

Questionários costumam pedir mais de 100 respostas para conclusões estatísticas. Com o prazo curto, o resultado será tratado como **evidência exploratória**, e o texto do TCC deve dizer isso.

**Agenda:**

| Data | Etapa |
| --- | --- |
| 19/10 | Montar os dois formulários e fazer um piloto com 2 colegas |
| 20/10 a 26/10 | Coleta: divulgação em grupos de turma e pedido aos professores |
| 27/10 a 28/10 | Análise e decisões para o protótipo |

**Atenção à ética em pesquisa:** pesquisas com pessoas em TCC normalmente passam pelo Comitê de Ética (CEP). A [Resolução CNS 510/2016](https://www.propq.ufscar.br/pt-br/assets/arquivos/etica/oficio-conep-orientacoes-acerca-do-artigo-1-o-da-resolucao-cns-n-o-510-de-7-de-abril-de-2016.pdf) dispensa a "pesquisa de opinião pública com participantes não identificados", desde que seja impossível identificar quem respondeu desde a coleta. Por isso os questionários não pedem nome, e-mail, matrícula nem curso específico. **Antes de divulgar, confirmem com o orientador ou a coordenação se a UniCuritiba exige submissão ao CEP mesmo assim**, porque a instituição pode ter regra própria.

## Texto de abertura e consentimento

Este texto vai na descrição do formulário, igual para alunos e professores. A primeira pergunta é obrigatória e encerra o formulário para quem não concordar. Troquem `[nomes da equipe]` e `[e-mail de contato da equipe]` antes de publicar.

> **Pesquisa: como deixar o TCC mais leve?**
>
> Olá! Somos [nomes da equipe], alunos de Engenharia de Software da UniCuritiba. Estamos construindo, como TCC, uma plataforma que ajuda alunos e orientadores no TCC: normas ABNT, etapas do trabalho e escolha de orientador.
>
> Sua opinião vai nos ajudar a decidir o que construir primeiro. Leva cerca de 5 minutos.
>
> **Sua privacidade:**
>
> - A pesquisa é **anônima**. Não pedimos nome, e-mail, matrícula nem nenhum dado que identifique você.
> - Por favor, não escreva nomes de pessoas (suas ou de professores) nas respostas abertas.
> - As respostas serão usadas só neste TCC e aparecerão apenas de forma agregada (percentuais e temas).
> - A participação é voluntária. Você pode parar a qualquer momento sem nenhuma consequência.
> - Os dados ficam guardados com a equipe e serão apagados após a apresentação do TCC.
>
> Dúvidas: [e-mail de contato da equipe]

**Pergunta 0 (obrigatória, múltipla escolha):** Você concorda em participar desta pesquisa anônima?

- Sim, concordo em participar → continua
- Não concordo → vai direto para o envio do formulário

## Questionário para alunos

São 15 perguntas em 5 seções, cerca de 5 minutos. Todas são obrigatórias, exceto a A15. A coluna Hipótese mostra o que cada pergunta testa e não vai para o formulário.

**Escala de concordância** (usada em várias perguntas): Discordo totalmente · Discordo · Neutro · Concordo · Concordo totalmente

**Seção 1: Seu momento no TCC**

| # | Pergunta | Tipo no Forms | Opções | Hipótese |
| --- | --- | --- | --- | --- |
| A1 | Em que momento do TCC você está? | Múltipla escolha | Ainda não comecei · Estou escolhendo tema ou orientador · Estou no meio do desenvolvimento · Estou na reta final · Já entreguei | Perfil |
| A2 | Qual a área do seu curso? | Múltipla escolha | Tecnologia e exatas · Saúde · Humanas e sociais · Negócios e gestão · Direito · Outra | Perfil |

**Seção 2: Dificuldades**

| # | Pergunta | Tipo no Forms | Opções | Hipótese |
| --- | --- | --- | --- | --- |
| A3 | Quanto cada item é (ou foi) difícil no seu TCC? | Grade de múltipla escolha | Linhas: Escolher o tema · Escolher o orientador · Aplicar as normas ABNT · Saber qual é o próximo passo · Cumprir prazos · Escrever o conteúdo · Conseguir tempo com o orientador. Colunas: 1 Nada difícil a 5 Muito difícil | H1, H2, H3 |
| A4 | Desses itens, qual é a sua MAIOR dificuldade? | Múltipla escolha | As mesmas 7 linhas da A3 | H1 |
| A5 | Nas normas ABNT, o que mais dá trabalho? | Caixas de seleção | Referências · Citações · Formatação (margens, fonte, espaçamento) · Sumário e numeração de seções · Resumo e palavras-chave · Figuras e tabelas · Não tenho dificuldade com ABNT | H1 |
| A6 | Você sabe quais são as etapas do seu TCC e o prazo de cada uma? | Escala linear 1 a 5 | 1 Não sei nada · 5 Sei com clareza | H2 |

**Seção 3: Escolha do orientador**

| # | Pergunta | Tipo no Forms | Opções | Hipótese |
| --- | --- | --- | --- | --- |
| A7 | Como você escolheu (ou pretende escolher) seu orientador? | Caixas de seleção | Já tive aula com o professor · Indicação de colegas · Área de pesquisa do professor · Disponibilidade do professor · Fui designado pela coordenação · Ainda não sei | H3 |
| A8 | "Tenho (ou tive) informação suficiente para escolher bem meu orientador." | Escala de concordância | 5 níveis | H3 |
| A9 | O que você gostaria de saber sobre um professor antes de escolhê-lo? | Caixas de seleção | Áreas de pesquisa · Temas que já orientou · Vagas disponíveis · Estilo de orientação (frequência de reuniões, nível de cobrança) · Tempo médio de resposta · Opinião agregada de ex-orientandos · Outro | H3, H5 |

**Seção 4: IA no TCC**

| # | Pergunta | Tipo no Forms | Opções | Hipótese |
| --- | --- | --- | --- | --- |
| A10 | Você já usou IA (ChatGPT, Gemini, Claude etc.) em trabalhos acadêmicos? | Múltipla escolha | Nunca · Algumas vezes · Frequentemente | H4 |
| A11 | "Eu usaria uma IA que aponta erros de ABNT e explica a correção, mas não escreve o texto por mim." | Escala de concordância | 5 níveis | H4 |
| A12 | "Eu usaria uma ferramenta que mostra as próximas etapas do meu TCC." | Escala de concordância | 5 níveis | H2 |

**Seção 5: Privacidade e sugestões**

| # | Pergunta | Tipo no Forms | Opções | Hipótese |
| --- | --- | --- | --- | --- |
| A13 | "Saber como meus dados são protegidos influencia minha decisão de usar uma plataforma." | Escala de concordância | 5 níveis | H6 |
| A14 | Quais informações você se sentiria confortável em colocar numa plataforma de TCC? | Caixas de seleção | Nome · E-mail institucional · Curso e período · Tema do TCC · Trechos do texto do TCC · Nenhuma dessas | H6 |
| A15 | Se uma plataforma pudesse resolver UMA coisa no seu TCC, o que seria? (opcional, sem citar nomes) | Parágrafo | — | Todas |

## Questionário para professores

São 13 perguntas em 4 seções, cerca de 5 minutos. O grupo de professores é pequeno, então o perfil é propositalmente vago (sem área nem tempo de casa), para ninguém ser identificável. A P13 é opcional; as demais são obrigatórias. A escala de concordância é a mesma dos alunos.

**Seção 1: Sua experiência com orientação**

| # | Pergunta | Tipo no Forms | Opções | Hipótese |
| --- | --- | --- | --- | --- |
| P1 | Você orienta ou já orientou TCC? | Múltipla escolha, sozinha na seção | Sim, atualmente · Já orientei, mas não no momento · Nunca orientei (vai direto para o envio) | Perfil |

**Seção 2: Sua rotina de orientação**

| # | Pergunta | Tipo no Forms | Opções | Hipótese |
| --- | --- | --- | --- | --- |
| P2 | Quantos orientandos de TCC você acompanha por semestre, em média? | Múltipla escolha | 1 a 3 · 4 a 6 · 7 ou mais | Perfil |
| P3 | Quanto cada item consome do seu tempo de orientação? | Grade de múltipla escolha | Linhas: Corrigir normas ABNT · Explicar etapas e prazos · Ajudar a definir o tema · Revisar conteúdo e argumentação · Orientar a metodologia · Cobrar entregas atrasadas. Colunas: 1 Quase nada a 5 Muito | H1, H2 |
| P4 | Em qual desses itens você gostaria de gastar MENOS tempo? | Múltipla escolha | As mesmas 6 linhas da P3 | H1, H2 |
| P5 | "Os alunos chegam ao TCC sabendo aplicar as normas ABNT." | Escala de concordância | 5 níveis | H1 |
| P6 | "Os alunos escolhem o orientador pela afinidade com o tema." | Escala de concordância | 5 níveis | H3 |

**Seção 3: IA e perfil de afinidade**

Descrição da seção no Forms: *"Na plataforma, cada professor teria um perfil de afinidade preenchido por ele mesmo (áreas de pesquisa, estilo de orientação, vagas). O sistema sugere orientadores aos alunos pela afinidade com o tema. Não existe ranking de professores."*

| # | Pergunta | Tipo no Forms | Opções | Hipótese |
| --- | --- | --- | --- | --- |
| P7 | "Eu recomendaria aos meus orientandos uma IA que aponta erros de ABNT e explica a correção, sem escrever o texto." | Escala de concordância | 5 níveis | H4 |
| P8 | Qual sua maior preocupação com o uso de IA pelos alunos no TCC? | Caixas de seleção | Texto gerado pela IA no lugar do aluno · Informações erradas · Aluno aprender menos · Privacidade dos dados · Não tenho preocupações · Outra | H4 |
| P9 | "Eu aceitaria ter um perfil de afinidade na plataforma, preenchido por mim." | Escala de concordância | 5 níveis | H5 |
| P10 | "Eu aceitaria que meu perfil mostrasse um resumo anônimo e agregado da opinião de ex-orientandos, moderado e exibido só a partir de 5 avaliações." | Escala de concordância | 5 níveis | H5 |
| P11 | O que você colocaria no seu perfil? | Caixas de seleção | Áreas de pesquisa · Temas que já orientou · Vagas disponíveis · Estilo de orientação · Forma de contato preferida · Nada, não teria perfil | H5 |

**Seção 4: Privacidade e sugestões**

| # | Pergunta | Tipo no Forms | Opções | Hipótese |
| --- | --- | --- | --- | --- |
| P12 | "A segurança dos dados dos alunos é decisiva para eu apoiar uma plataforma como essa." | Escala de concordância | 5 níveis | H6 |
| P13 | O que mais ajudaria você a orientar TCCs? (opcional, sem citar nomes) | Parágrafo | — | Todas |

## Como montar no Google Forms

**Caminho rápido (recomendado): um script cria tudo em cerca de 2 minutos.** O arquivo [`scripts/criar-formularios.gs`](../scripts/criar-formularios.gs) monta os dois formulários exatamente como neste kit: consentimento, seções, desvios, grades, coleta de e-mail desligada, planilhas de respostas e uma pasta "Threshold — Validação" no Drive. Ele foi testado com uma simulação do Google, não numa conta real, então confiram os formulários no piloto.

1. Acessem [script.google.com](https://script.google.com) com a conta da equipe e cliquem em "Novo projeto".
2. Apaguem o conteúdo do editor e colem o arquivo inteiro.
3. Preencham `NOMES_DA_EQUIPE` e `EMAIL_DE_CONTATO` no topo. Sem isso, o script para com um aviso.
4. Escolham a função `criarFormularios` e cliquem em "Executar".
5. Autorizem o acesso a Formulários, Planilhas e Drive. Como o script é de vocês e não foi publicado, o Google mostra "app não verificado": cliquem em "Avançado" e depois em "Acessar".
6. Abram o "Registro de execução": os links para editar, responder e ver as respostas aparecem lá.

Se mudarem uma pergunta, mudem no kit e no script, para os dois continuarem iguais.

**Caminho manual:** montem o formulário dos alunos primeiro. O dos professores sai de uma cópia dele, trocando as perguntas.

1. Criem o formulário numa conta da equipe (não pessoal), com o título "Pesquisa: como deixar o TCC mais leve?" e o texto de abertura na descrição.
2. Em **Configurações > Respostas**, deixem "Coletar endereços de e-mail" em **Não coletar** e "Limitar a 1 resposta" **desligado**. Essa opção exige login com conta Google e afasta respondentes.
3. Em **Configurações > Apresentação**, liguem "Mostrar barra de progresso" e escrevam uma mensagem de agradecimento.
4. Criem a Pergunta 0 (consentimento). No menu de três pontos, escolham "Ir para a seção com base na resposta": "Sim" continua e "Não" vai para "Enviar formulário".
5. Usem **Adicionar seção** para cada seção do questionário, com o título da tabela correspondente.
6. Cadastrem as perguntas com o tipo indicado. A escala de concordância é "Múltipla escolha" com os 5 níveis, sempre na mesma ordem.
7. Na aba **Respostas**, cliquem em "Vincular ao Planilhas" para ter os dados numa planilha da equipe.
8. Façam o piloto com 2 colegas: cronometrem o tempo, anotem dúvidas, ajustem e **apaguem as respostas do piloto** antes de divulgar.
9. Para o formulário dos professores, usem "Fazer uma cópia" e troquem as seções pelas perguntas P1 a P13. Na P1, "Nunca orientei" vai para "Enviar formulário". Deixem a P1 sozinha na seção: o Forms só aplica o desvio no fim da seção.

**Divulgação:** mensagem curta nos grupos de turma com o link e o tempo de resposta ("5 minutos, anônimo"). Para professores, um e-mail pessoal da equipe ou um pedido via orientador funciona melhor que grupo. Um lembrete no dia 23/10 costuma recuperar boa parte de quem esqueceu.

## Como analisar

Cada hipótese tem um critério definido **antes** da coleta. Isso evita interpretar os dados do jeito mais conveniente e dá rigor ao capítulo de metodologia. Os critérios são uma proposta da equipe e podem ser ajustados com o orientador, mas só antes de abrir as respostas.

**Métrica principal:** nas escalas de concordância, usar o percentual de "Concordo" + "Concordo totalmente" (top-2). Nas grades de 1 a 5, usar a média de cada linha e o percentual de notas 4 e 5.

| Hipótese | Perguntas | Confirma se | Se confirmar | Se não confirmar |
| --- | --- | --- | --- | --- |
| H1 ABNT é uma das maiores dores | A3, A4, A5, P3, P5 | ABNT entre as 3 maiores médias da A3 ou escolhida por 25% ou mais na A4 | Revisor ABNT segue como fatia funcional; a A5 define se começa por referências ou citações | Trocar a fatia funcional pelo item mais difícil da A3 |
| H2 Aluno não sabe o próximo passo | A3, A6, A12 | Média da A6 menor que 3 e 60% ou mais de top-2 na A12 | Roadmap sobe para funcional no nível "se sobrar tempo" | Roadmap fica só em tela |
| H3 Escolha de orientador sem informação | A7, A8, A9, P6 | Menos de 50% de top-2 na A8 | Perfil de afinidade continua no protótipo; a A9 define os campos | Reduzir o perfil a uma vitrine simples |
| H4 IA que orienta é aceita | A10, A11, P7, P8 | 60% ou mais de top-2 na A11 e na P7 | Manter a proposta; a P8 vira lista de salvaguardas no TCC | Rever a proposta de IA com o orientador |
| H5 Professores aceitam o perfil | P9, P10, P11 | 60% ou mais de top-2 na P9 | Perfil fica; feedback agregado só entra se a P10 também passar de 60% | Perfil vira opcional e sem feedback |
| H6 Segurança pesa na decisão | A13, A14, P12 | 60% ou mais de top-2 na A13 e na P12 | Reforça a segurança como pilar; a A14 define os dados mínimos do cadastro | Segurança segue igual, mas com menos destaque na apresentação |

**Respostas abertas (A15 e P13):** ler todas, agrupar por tema (mapa de afinidade) e contar quantas respostas caem em cada tema. Citar trechos no TCC só se não identificarem ninguém.

**Ressalva para o texto do TCC:** com cerca de 30 alunos e 5 professores, a amostra é de conveniência e não representa toda a universidade. O resultado orienta decisões de produto e não permite generalizar.

## Checklist de execução

- [ ] Confirmar com o orientador ou a coordenação se a pesquisa precisa passar pelo CEP (antes de divulgar)
- [ ] Revisar os critérios de análise com o orientador e congelar a versão
- [ ] Preencher nomes e e-mail de contato no texto de abertura
- [x] Montar o formulário dos alunos (19/10)
- [x] Montar o formulário dos professores a partir da cópia (19/10)
- [ ] Fazer o piloto com 2 colegas, ajustar e apagar as respostas do piloto (19/10)
- [ ] Divulgar nos grupos de turma e enviar aos professores (20/10)
- [ ] Mandar lembrete (23/10)
- [ ] Encerrar o recebimento de respostas (26/10)
- [ ] Analisar e registrar as decisões neste doc e no documento de visão (27 a 28/10)
- [ ] Apagar a planilha de respostas após a apresentação do TCC, como prometido no consentimento

## Registro da coleta

Diário do que aconteceu durante a coleta, para o capítulo de metodologia do TCC.

| Data | Evento |
| --- | --- |
| 19/10/2026 | Formulários publicados. O dos alunos recebeu as 4 primeiras respostas entre 17h23 e 17h58. |
| 19/10/2026 | **Correção de privacidade.** A versão publicada tinha uma pergunta pedindo os nomes dos participantes, que não estava no kit e contrariava o texto de consentimento ("não pedimos nome"). Uma resposta trouxe um nome. No mesmo dia, a pergunta foi removida do formulário e o conteúdo da coluna foi apagado da planilha (conferido: coluna vazia). As respostas continuam válidas, porque o restante não identifica ninguém. |
| 19/10/2026 | Diferenças em relação ao kit: a A3 (grade de dificuldade) virou uma escolha única ("o que é mais difícil") seguida de uma pergunta sobre o grau de dificuldade. O script de análise foi ajustado no mesmo dia para entender os dois formatos (veja `analise/README.md`). Como a grade A3 não existe, o H1 é avaliado só pela metade "≥25% escolheram ABNT" do critério, e o relatório avisa isso. |
| 19/10/2026 | O script de análise passou a descartar, na leitura, qualquer coluna que identifique pessoas e a tarjar e-mail, CPF e telefone nas respostas abertas. |
| 06/11/2026 | Primeira análise com 5 alunos (formato publicado): "Escolher o tema" foi a maior dificuldade (60%) e ABNT não foi escolhida como maior dificuldade (H1 não confirmado pelo critério disponível), embora formatação apareça como o que mais pesa dentro da ABNT (80%). H2 e H3 também não confirmados; A11 (aceitaria IA que orienta) = 80% e A13 (proteção pesa) = 100%. Decisão: criar a Sala de Recorte do tema. 1 professor respondeu; a planilha dos professores ainda não estava vinculada. |
| 14/11/2026 | Respostas dos professores localizadas: a planilha ligada ao formulário chama-se "RSVP do evento (respostas)" (o formulário nasceu de um modelo de RSVP). 4 respostas, 3 válidas (1 "Nunca orientei", removida pelo critério do kit). Sem coluna de nome. Diferenças do kit: a P3 (grade de tempo) virou caixas de seleção e não é analisável; concordância em escala de 1 a 5. |
| 14/11/2026 | Análise com 5 alunos e 3 professores: H1, H2 e H3 não confirmadas; **H4 não confirmada** (alunos 80%, mas só 1 de 3 professores recomendaria a IA; os outros 2 ficaram neutros); **H5 confirmada** (2 de 3 aceitam o perfil de afinidade; 2 de 3 aceitam o resumo agregado de ex-orientandos); **H6 confirmada** (proteção de dados: 100% nos dois grupos). Nenhum professor concorda que os alunos chegam sabendo ABNT. O que cada professor quer gastar menos tempo fazendo: corrigir ABNT, explicar etapas e prazos, cobrar entregas atrasadas (um voto cada). Maior preocupação com IA: texto gerado no lugar do aluno (2 de 3). Amostra abaixo do mínimo do kit: evidência exploratória. |

