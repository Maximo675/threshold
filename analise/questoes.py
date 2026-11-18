"""Definição das perguntas dos questionários do Threshold.

Fonte única: scripts/criar-formularios.gs (títulos e opções EXATOS do Google Forms)
e docs/02-kit-de-validacao.md. Se uma pergunta mudar lá, mude aqui também.
"""

CONSENTIMENTO = "Você concorda em participar desta pesquisa anônima?"
CONSENTIU = "Sim, concordo em participar"
NAO_CONSENTIU = "Não concordo"

# Formulário publicado em 19/10/2026 (diferente do kit): consentimento em duas perguntas.
# Fica quem respondeu "Sim..." na primeira e não começou com "Não" na segunda.
COLUNAS_CONSENTIMENTO = [CONSENTIMENTO, "Consentimento", "Você pode participar?"]

# Colunas que identificam pessoas: o script as DESCARTA na leitura, antes de qualquer análise,
# e nunca as copia para relatório, gráfico ou JSON (Res. CNS 510/2016: participantes não identificados).
PADRAO_IDENTIFICACAO = r"\bnomes?\b|e-?mail|endere[cç]o|matr[ií]cula|telefone|celular|whats|\bcpf\b|\brg\b"

CONCORDANCIA = ["Discordo totalmente", "Discordo", "Neutro", "Concordo", "Concordo totalmente"]
TOP2 = {"Concordo", "Concordo totalmente"}

DIFICULDADES_ALUNO = [
    "Escolher o tema",
    "Escolher o orientador",
    "Aplicar as normas ABNT",
    "Saber qual é o próximo passo",
    "Cumprir prazos",
    "Escrever o conteúdo",
    "Conseguir tempo com o orientador",
]
LINHA_ABNT = "Aplicar as normas ABNT"

GRAU_DIFICULDADE = ["Muito fácil", "Fácil", "Moderado", "Difícil", "Muito difícil"]

TEMPO_ORIENTACAO = [
    "Corrigir normas ABNT",
    "Explicar etapas e prazos",
    "Ajudar a definir o tema",
    "Revisar conteúdo e argumentação",
    "Orientar a metodologia",
    "Cobrar entregas atrasadas",
]

# tipo: multipla | caixas | grade | escala | concordancia | paragrafo
# aliases: outros títulos aceitos para a mesma pergunta (versão publicada do formulário).
# opcoes_extra: opções que só existem na versão publicada (contam como opção, não como texto livre).
ALUNOS = {
    "A0": dict(tipo="paragrafo", titulo="Comentários e/ou perguntas", so_publicado=True),
    "A1": dict(tipo="multipla", titulo="A1. Em que momento do TCC você está?",
               opcoes=["Ainda não comecei", "Estou escolhendo tema ou orientador", "Estou no meio do desenvolvimento",
                       "Estou na reta final", "Já entreguei"]),
    "A2": dict(tipo="multipla", titulo="A2. Qual a área do seu curso?",
               opcoes=["Tecnologia e exatas", "Saúde", "Humanas e sociais", "Negócios e gestão", "Direito", "Outra"]),
    "A3": dict(tipo="grade", titulo="A3. Quanto cada item é (ou foi) difícil no seu TCC?",
               linhas=DIFICULDADES_ALUNO, colunas=["1 - Nada difícil", "2", "3", "4", "5 - Muito difícil"]),
    # Na versão publicada, a A3 virou escolha única ("qual item é o mais difícil"): na prática é a A4.
    "A4": dict(tipo="multipla", titulo="A4. Desses itens, qual é a sua MAIOR dificuldade?", opcoes=DIFICULDADES_ALUNO,
               aliases=["Quanto cada item é (ou foi) difícil no seu TCC?"]),
    "A4G": dict(tipo="multipla", so_publicado=True,
                titulo="Conforme a pergunta anterior, qual é o grau de dificuldade para executar cada uma dessas tarefas ?",
                opcoes=GRAU_DIFICULDADE),
    "A5": dict(tipo="caixas", titulo="A5. Nas normas ABNT, o que mais dá trabalho?",
               opcoes=["Referências", "Citações", "Formatação (margens, fonte, espaçamento)",
                       "Sumário e numeração de seções", "Resumo e palavras-chave", "Figuras e tabelas",
                       "Não tenho dificuldade com ABNT"],
               # no formulário publicado, duas opções ficaram juntas numa só
               opcoes_extra=["Resumo e palavras-chave · Figuras e tabelas"]),
    "A6": dict(tipo="escala", titulo="A6. Você sabe quais são as etapas do seu TCC e o prazo de cada uma?",
               minimo=1, maximo=5, rotulos=("Não sei nada", "Sei com clareza")),
    "A7": dict(tipo="caixas", titulo="A7. Como você escolheu (ou pretende escolher) seu orientador?",
               opcoes=["Já tive aula com o professor", "Indicação de colegas", "Área de pesquisa do professor",
                       "Disponibilidade do professor", "Fui designado pela coordenação", "Ainda não sei"]),
    "A8": dict(tipo="concordancia",
               titulo='A8. "Tenho (ou tive) informação suficiente para escolher bem meu orientador."'),
    "A9": dict(tipo="caixas", titulo="A9. O que você gostaria de saber sobre um professor antes de escolhê-lo?",
               opcoes=["Áreas de pesquisa", "Temas que já orientou", "Vagas disponíveis",
                       "Estilo de orientação (frequência de reuniões, nível de cobrança)", "Tempo médio de resposta",
                       "Opinião agregada de ex-orientandos", "Outro"]),
    "A10": dict(tipo="multipla", titulo="A10. Você já usou IA (ChatGPT, Gemini, Claude etc.) em trabalhos acadêmicos?",
                opcoes=["Nunca", "Algumas vezes", "Frequentemente"]),
    "A11": dict(tipo="concordancia",
                titulo='A11. "Eu usaria uma IA que aponta erros de ABNT e explica a correção, mas não escreve o texto por mim."'),
    "A12": dict(tipo="concordancia", titulo='A12. "Eu usaria uma ferramenta que mostra as próximas etapas do meu TCC."'),
    "A13": dict(tipo="concordancia",
                titulo='A13. "Saber como meus dados são protegidos influencia minha decisão de usar uma plataforma."'),
    "A14": dict(tipo="caixas",
                titulo="A14. Quais informações você se sentiria confortável em colocar numa plataforma de TCC?",
                opcoes=["Nome", "E-mail institucional", "Curso e período", "Tema do TCC", "Trechos do texto do TCC",
                        "Nenhuma dessas"]),
    "A15": dict(tipo="paragrafo", titulo="A15. Se uma plataforma pudesse resolver UMA coisa no seu TCC, o que seria?",
                aliases=["Se uma plataforma pudesse resolver UMA coisa no seu TCC, o que seria? (opcional, sem citar nomes)"]),
}

NUNCA_ORIENTOU = "Nunca orientei"

PROFESSORES = {
    "P1": dict(tipo="multipla", titulo="P1. Você orienta ou já orientou TCC?",
               opcoes=["Sim, atualmente", "Já orientei, mas não no momento", NUNCA_ORIENTOU]),
    "P2": dict(tipo="multipla", titulo="P2. Quantos orientandos de TCC você acompanha por semestre, em média?",
               opcoes=["1 a 3", "4 a 6", "7 ou mais"]),
    "P3": dict(tipo="grade", titulo="P3. Quanto cada item consome do seu tempo de orientação?",
               linhas=TEMPO_ORIENTACAO, colunas=["1 - Quase nada", "2", "3", "4", "5 - Muito"]),
    "P4": dict(tipo="multipla", titulo="P4. Em qual desses itens você gostaria de gastar MENOS tempo?",
               opcoes=TEMPO_ORIENTACAO),
    "P5": dict(tipo="concordancia", titulo='P5. "Os alunos chegam ao TCC sabendo aplicar as normas ABNT."'),
    "P6": dict(tipo="concordancia", titulo='P6. "Os alunos escolhem o orientador pela afinidade com o tema."'),
    "P7": dict(tipo="concordancia",
               titulo='P7. "Eu recomendaria aos meus orientandos uma IA que aponta erros de ABNT e explica a correção, sem escrever o texto."'),
    "P8": dict(tipo="caixas", titulo="P8. Qual sua maior preocupação com o uso de IA pelos alunos no TCC?",
               opcoes=["Texto gerado pela IA no lugar do aluno", "Informações erradas", "Aluno aprender menos",
                       "Privacidade dos dados", "Não tenho preocupações", "Outra"]),
    "P9": dict(tipo="concordancia",
               titulo='P9. "Eu aceitaria ter um perfil de afinidade na plataforma, preenchido por mim."'),
    "P10": dict(tipo="concordancia",
                titulo='P10. "Eu aceitaria que meu perfil mostrasse um resumo anônimo e agregado da opinião de ex-orientandos, moderado e exibido só a partir de 5 avaliações."'),
    "P11": dict(tipo="caixas", titulo="P11. O que você colocaria no seu perfil?",
                opcoes=["Áreas de pesquisa", "Temas que já orientou", "Vagas disponíveis", "Estilo de orientação",
                        "Forma de contato preferida", "Nada, não teria perfil"]),
    "P12": dict(tipo="concordancia",
                titulo='P12. "A segurança dos dados dos alunos é decisiva para eu apoiar uma plataforma como essa."'),
    "P13": dict(tipo="paragrafo", titulo="P13. O que mais ajudaria você a orientar TCCs?",
                aliases=["O que mais ajudaria você a orientar TCCs? (opcional, sem citar nomes)"]),
}

# Grafias diferentes que aparecem nas respostas reais e valem a mesma opção
SINONIMOS = {"Referencias": "Referências"}

MIN_ALUNOS = 30
MIN_PROFESSORES = 5
