/**
 * Threshold — Criador dos questionários de validação
 * ---------------------------------------------------
 * Cria, na sua conta Google, os DOIS formulários do Kit de Validação:
 *   1. Questionário para alunos (15 perguntas)
 *   2. Questionário para professores (13 perguntas)
 *
 * Cada formulário já sai com:
 *   - texto de abertura e consentimento (LGPD) na descrição
 *   - pergunta de consentimento que encerra o formulário para quem não concordar
 *   - seções, grades, escalas e caixas de seleção iguais às do kit
 *   - coleta de e-mail DESLIGADA e sem exigir login (pesquisa anônima)
 *   - barra de progresso e mensagem de agradecimento
 *   - planilha de respostas vinculada
 * Tudo fica numa pasta "Threshold — Validação" no seu Google Drive.
 *
 * COMO USAR
 *   1. Acesse https://script.google.com e clique em "Novo projeto".
 *   2. Apague o conteúdo do editor e cole este arquivo inteiro.
 *   3. Preencha NOMES_DA_EQUIPE e EMAIL_DE_CONTATO logo abaixo.
 *   4. Selecione a função "criarFormularios" e clique em "Executar".
 *   5. Autorize o acesso (Formulários, Planilhas e Drive). Como o script é seu
 *      e não foi publicado, o Google mostra "app não verificado": clique em
 *      "Avançado" > "Acessar Projeto sem título (não seguro)".
 *   6. Abra "Registro de execução": os links dos formulários e planilhas aparecem lá.
 *
 * Fonte das perguntas: claude/threshold/02-kit-de-validacao.md
 * Se mudar uma pergunta no kit, mude aqui também (e vice-versa).
 */

// ============ PREENCHA ANTES DE EXECUTAR ============
const NOMES_DA_EQUIPE = '[nomes da equipe]';
const EMAIL_DE_CONTATO = '[e-mail de contato da equipe]';
// ====================================================

const NOME_DA_PASTA = 'Threshold — Validação';
const TITULO_ALUNOS = 'Pesquisa: como deixar o TCC mais leve? (Alunos)';
const TITULO_PROFESSORES = 'Pesquisa: como deixar o TCC mais leve? (Professores)';

/** Escala de concordância usada nas duas pesquisas, sempre na mesma ordem. */
const CONCORDANCIA = ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente'];

// ---------------------------------------------------------------------------
// Perguntas. Cada item: { tipo, titulo, opcoes?, linhas?, colunas?, obrigatoria? }
// tipos: 'secao', 'multipla', 'caixas', 'grade', 'escala', 'concordancia', 'paragrafo'
// ---------------------------------------------------------------------------

const DIFICULDADES_ALUNO = [
  'Escolher o tema',
  'Escolher o orientador',
  'Aplicar as normas ABNT',
  'Saber qual é o próximo passo',
  'Cumprir prazos',
  'Escrever o conteúdo',
  'Conseguir tempo com o orientador',
];

const PERGUNTAS_ALUNOS = [
  { tipo: 'secao', titulo: 'Seção 1: Seu momento no TCC' },
  { tipo: 'multipla', titulo: 'A1. Em que momento do TCC você está?',
    opcoes: ['Ainda não comecei', 'Estou escolhendo tema ou orientador', 'Estou no meio do desenvolvimento', 'Estou na reta final', 'Já entreguei'] },
  { tipo: 'multipla', titulo: 'A2. Qual a área do seu curso?',
    opcoes: ['Tecnologia e exatas', 'Saúde', 'Humanas e sociais', 'Negócios e gestão', 'Direito', 'Outra'] },

  { tipo: 'secao', titulo: 'Seção 2: Dificuldades' },
  { tipo: 'grade', titulo: 'A3. Quanto cada item é (ou foi) difícil no seu TCC?',
    linhas: DIFICULDADES_ALUNO, colunas: ['1 - Nada difícil', '2', '3', '4', '5 - Muito difícil'] },
  { tipo: 'multipla', titulo: 'A4. Desses itens, qual é a sua MAIOR dificuldade?', opcoes: DIFICULDADES_ALUNO },
  { tipo: 'caixas', titulo: 'A5. Nas normas ABNT, o que mais dá trabalho?',
    opcoes: ['Referências', 'Citações', 'Formatação (margens, fonte, espaçamento)', 'Sumário e numeração de seções', 'Resumo e palavras-chave', 'Figuras e tabelas', 'Não tenho dificuldade com ABNT'] },
  { tipo: 'escala', titulo: 'A6. Você sabe quais são as etapas do seu TCC e o prazo de cada uma?',
    minimo: 1, maximo: 5, rotuloMin: 'Não sei nada', rotuloMax: 'Sei com clareza' },

  { tipo: 'secao', titulo: 'Seção 3: Escolha do orientador' },
  { tipo: 'caixas', titulo: 'A7. Como você escolheu (ou pretende escolher) seu orientador?',
    opcoes: ['Já tive aula com o professor', 'Indicação de colegas', 'Área de pesquisa do professor', 'Disponibilidade do professor', 'Fui designado pela coordenação', 'Ainda não sei'] },
  { tipo: 'concordancia', titulo: 'A8. "Tenho (ou tive) informação suficiente para escolher bem meu orientador."' },
  { tipo: 'caixas', titulo: 'A9. O que você gostaria de saber sobre um professor antes de escolhê-lo?',
    opcoes: ['Áreas de pesquisa', 'Temas que já orientou', 'Vagas disponíveis', 'Estilo de orientação (frequência de reuniões, nível de cobrança)', 'Tempo médio de resposta', 'Opinião agregada de ex-orientandos', 'Outro'] },

  { tipo: 'secao', titulo: 'Seção 4: IA no TCC' },
  { tipo: 'multipla', titulo: 'A10. Você já usou IA (ChatGPT, Gemini, Claude etc.) em trabalhos acadêmicos?',
    opcoes: ['Nunca', 'Algumas vezes', 'Frequentemente'] },
  { tipo: 'concordancia', titulo: 'A11. "Eu usaria uma IA que aponta erros de ABNT e explica a correção, mas não escreve o texto por mim."' },
  { tipo: 'concordancia', titulo: 'A12. "Eu usaria uma ferramenta que mostra as próximas etapas do meu TCC."' },

  { tipo: 'secao', titulo: 'Seção 5: Privacidade e sugestões' },
  { tipo: 'concordancia', titulo: 'A13. "Saber como meus dados são protegidos influencia minha decisão de usar uma plataforma."' },
  { tipo: 'caixas', titulo: 'A14. Quais informações você se sentiria confortável em colocar numa plataforma de TCC?',
    opcoes: ['Nome', 'E-mail institucional', 'Curso e período', 'Tema do TCC', 'Trechos do texto do TCC', 'Nenhuma dessas'] },
  { tipo: 'paragrafo', titulo: 'A15. Se uma plataforma pudesse resolver UMA coisa no seu TCC, o que seria?',
    ajuda: 'Opcional. Por favor, não cite nomes de pessoas.', obrigatoria: false },
];

const TEMPO_ORIENTACAO = [
  'Corrigir normas ABNT',
  'Explicar etapas e prazos',
  'Ajudar a definir o tema',
  'Revisar conteúdo e argumentação',
  'Orientar a metodologia',
  'Cobrar entregas atrasadas',
];

const PERGUNTAS_PROFESSORES = [
  { tipo: 'secao', titulo: 'Seção 1: Sua experiência com orientação' },
  // P1 tem ramificação: "Nunca orientei" vai direto para o envio.
  // Ela fica SOZINHA na seção: o Forms só aplica o desvio no fim da seção,
  // então qualquer pergunta obrigatória ao lado dela seria cobrada de quem nunca orientou.
  { tipo: 'multipla', titulo: 'P1. Você orienta ou já orientou TCC?',
    opcoes: ['Sim, atualmente', 'Já orientei, mas não no momento', 'Nunca orientei'], encerraCom: 'Nunca orientei' },

  { tipo: 'secao', titulo: 'Seção 2: Sua rotina de orientação' },
  { tipo: 'multipla', titulo: 'P2. Quantos orientandos de TCC você acompanha por semestre, em média?',
    opcoes: ['1 a 3', '4 a 6', '7 ou mais'] },
  { tipo: 'grade', titulo: 'P3. Quanto cada item consome do seu tempo de orientação?',
    linhas: TEMPO_ORIENTACAO, colunas: ['1 - Quase nada', '2', '3', '4', '5 - Muito'] },
  { tipo: 'multipla', titulo: 'P4. Em qual desses itens você gostaria de gastar MENOS tempo?', opcoes: TEMPO_ORIENTACAO },
  { tipo: 'concordancia', titulo: 'P5. "Os alunos chegam ao TCC sabendo aplicar as normas ABNT."' },
  { tipo: 'concordancia', titulo: 'P6. "Os alunos escolhem o orientador pela afinidade com o tema."' },

  { tipo: 'secao', titulo: 'Seção 3: IA e perfil de afinidade',
    ajuda: 'Na plataforma, cada professor teria um perfil de afinidade preenchido por ele mesmo (áreas de pesquisa, estilo de orientação, vagas). O sistema sugere orientadores aos alunos pela afinidade com o tema. Não existe ranking de professores.' },
  { tipo: 'concordancia', titulo: 'P7. "Eu recomendaria aos meus orientandos uma IA que aponta erros de ABNT e explica a correção, sem escrever o texto."' },
  { tipo: 'caixas', titulo: 'P8. Qual sua maior preocupação com o uso de IA pelos alunos no TCC?',
    opcoes: ['Texto gerado pela IA no lugar do aluno', 'Informações erradas', 'Aluno aprender menos', 'Privacidade dos dados', 'Não tenho preocupações', 'Outra'] },
  { tipo: 'concordancia', titulo: 'P9. "Eu aceitaria ter um perfil de afinidade na plataforma, preenchido por mim."' },
  { tipo: 'concordancia', titulo: 'P10. "Eu aceitaria que meu perfil mostrasse um resumo anônimo e agregado da opinião de ex-orientandos, moderado e exibido só a partir de 5 avaliações."' },
  { tipo: 'caixas', titulo: 'P11. O que você colocaria no seu perfil?',
    opcoes: ['Áreas de pesquisa', 'Temas que já orientou', 'Vagas disponíveis', 'Estilo de orientação', 'Forma de contato preferida', 'Nada, não teria perfil'] },

  { tipo: 'secao', titulo: 'Seção 4: Privacidade e sugestões' },
  { tipo: 'concordancia', titulo: 'P12. "A segurança dos dados dos alunos é decisiva para eu apoiar uma plataforma como essa."' },
  { tipo: 'paragrafo', titulo: 'P13. O que mais ajudaria você a orientar TCCs?',
    ajuda: 'Opcional. Por favor, não cite nomes de pessoas.', obrigatoria: false },
];

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

/** Função principal: selecione esta e clique em Executar. */
function criarFormularios() {
  if (NOMES_DA_EQUIPE.indexOf('[') !== -1 || EMAIL_DE_CONTATO.indexOf('[') !== -1) {
    throw new Error('Preencha NOMES_DA_EQUIPE e EMAIL_DE_CONTATO no topo do script antes de executar.');
  }

  const pasta = obterPasta_(NOME_DA_PASTA);
  const alunos = montarFormulario_(TITULO_ALUNOS, PERGUNTAS_ALUNOS, pasta);
  const professores = montarFormulario_(TITULO_PROFESSORES, PERGUNTAS_PROFESSORES, pasta);

  Logger.log('Pronto! Tudo está na pasta "%s" do seu Drive.', NOME_DA_PASTA);
  [alunos, professores].forEach(function (r) {
    Logger.log('\n%s\n  Editar:      %s\n  Responder:   %s\n  Respostas:   %s',
      r.titulo, r.editar, r.responder, r.planilha);
  });
  Logger.log('\nPróximo passo: faça o piloto com 2 colegas e APAGUE as respostas do piloto antes de divulgar.');
}

/** Cria um formulário completo a partir da lista de perguntas. */
function montarFormulario_(titulo, perguntas, pasta) {
  const form = FormApp.create(titulo);
  form.setDescription(textoDeAbertura_());
  configurarPrivacidade_(form);
  form.setProgressBar(true);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage('Obrigado por participar! Suas respostas anônimas vão ajudar a construir uma plataforma que deixa o TCC mais leve.');

  adicionarConsentimento_(form);

  perguntas.forEach(function (p) { adicionarPergunta_(form, p); });

  // Planilha de respostas, na mesma pasta.
  const planilha = SpreadsheetApp.create('Respostas — ' + titulo);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, planilha.getId());

  publicar_(form);
  moverParaPasta_(form.getId(), pasta);
  moverParaPasta_(planilha.getId(), pasta);

  return {
    titulo: titulo,
    editar: form.getEditUrl(),
    responder: form.getPublishedUrl(),
    planilha: planilha.getUrl(),
  };
}

/** Texto de abertura e consentimento (o mesmo do kit). */
function textoDeAbertura_() {
  return [
    'Olá! Somos ' + NOMES_DA_EQUIPE + ', alunos de Engenharia de Software da UniCuritiba. Estamos construindo, como TCC, uma plataforma que ajuda alunos e orientadores no TCC: normas ABNT, etapas do trabalho e escolha de orientador.',
    '',
    'Sua opinião vai nos ajudar a decidir o que construir primeiro. Leva cerca de 5 minutos.',
    '',
    'SUA PRIVACIDADE',
    '• A pesquisa é anônima. Não pedimos nome, e-mail, matrícula nem nenhum dado que identifique você.',
    '• Por favor, não escreva nomes de pessoas (suas ou de professores) nas respostas abertas.',
    '• As respostas serão usadas só neste TCC e aparecerão apenas de forma agregada (percentuais e temas).',
    '• A participação é voluntária. Você pode parar a qualquer momento sem nenhuma consequência.',
    '• Os dados ficam guardados com a equipe e serão apagados após a apresentação do TCC.',
    '',
    'Dúvidas: ' + EMAIL_DE_CONTATO,
  ].join('\n');
}

/** Pesquisa anônima: não coleta e-mail e não exige login. */
function configurarPrivacidade_(form) {
  try {
    form.setEmailCollectionType(FormApp.EmailCollectionType.DO_NOT_COLLECT);
  } catch (e) {
    form.setCollectEmail(false); // contas/versões antigas
  }
  form.setLimitOneResponsePerUser(false); // "limitar a 1 resposta" exige login com conta Google
  form.setAllowResponseEdits(false);
  try {
    form.setRequireLogin(false); // só existe em contas Google Workspace
  } catch (e) { /* conta pessoal: nada a fazer */ }
}

/** Pergunta 0: quem não concorda vai direto para o envio. */
function adicionarConsentimento_(form) {
  const item = form.addMultipleChoiceItem()
    .setTitle('Você concorda em participar desta pesquisa anônima?')
    .setRequired(true);
  item.setChoices([
    item.createChoice('Sim, concordo em participar', FormApp.PageNavigationType.CONTINUE),
    item.createChoice('Não concordo', FormApp.PageNavigationType.SUBMIT),
  ]);
}

/** Adiciona um item conforme o tipo. */
function adicionarPergunta_(form, p) {
  const obrigatoria = p.obrigatoria !== false;
  switch (p.tipo) {
    case 'secao': {
      const secao = form.addPageBreakItem().setTitle(p.titulo);
      if (p.ajuda) secao.setHelpText(p.ajuda);
      return;
    }
    case 'multipla': {
      const item = form.addMultipleChoiceItem().setTitle(p.titulo).setRequired(obrigatoria);
      if (p.encerraCom) {
        item.setChoices(p.opcoes.map(function (o) {
          return item.createChoice(o, o === p.encerraCom
            ? FormApp.PageNavigationType.SUBMIT
            : FormApp.PageNavigationType.CONTINUE);
        }));
      } else {
        item.setChoiceValues(p.opcoes);
      }
      return;
    }
    case 'caixas':
      form.addCheckboxItem().setTitle(p.titulo).setChoiceValues(p.opcoes).setRequired(obrigatoria);
      return;
    case 'grade':
      form.addGridItem().setTitle(p.titulo).setRows(p.linhas).setColumns(p.colunas).setRequired(obrigatoria);
      return;
    case 'escala':
      form.addScaleItem().setTitle(p.titulo)
        .setBounds(p.minimo, p.maximo)
        .setLabels(p.rotuloMin, p.rotuloMax)
        .setRequired(obrigatoria);
      return;
    case 'concordancia':
      form.addMultipleChoiceItem().setTitle(p.titulo).setChoiceValues(CONCORDANCIA).setRequired(obrigatoria);
      return;
    case 'paragrafo': {
      const item = form.addParagraphTextItem().setTitle(p.titulo).setRequired(obrigatoria);
      if (p.ajuda) item.setHelpText(p.ajuda);
      return;
    }
    default:
      throw new Error('Tipo de pergunta desconhecido: ' + p.tipo);
  }
}

/** Formulários novos podem nascer "não publicados"; publica quando o recurso existe. */
function publicar_(form) {
  try {
    if (form.supportsAdvancedResponderPermissions()) form.setPublished(true);
  } catch (e) { /* formulário no modelo antigo: já aceita respostas */ }
  form.setAcceptingResponses(true);
}

/** Reaproveita a pasta se ela já existir. */
function obterPasta_(nome) {
  const existentes = DriveApp.getFoldersByName(nome);
  return existentes.hasNext() ? existentes.next() : DriveApp.createFolder(nome);
}

function moverParaPasta_(arquivoId, pasta) {
  DriveApp.getFileById(arquivoId).moveTo(pasta);
}
