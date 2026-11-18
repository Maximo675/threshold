# Análise da validação

Script que lê as respostas dos dois questionários (alunos e professores), aplica os critérios das hipóteses H1 a H6 e gera um relatório pronto para a banca. Os critérios são os da seção "Como analisar" do [Kit de Validação](../docs/02-kit-de-validacao.md) e foram definidos **antes** da coleta.

## 1. Exportar as respostas

Para cada formulário (alunos e professores):

1. No Google Forms, aba **Respostas** → **Vincular ao Planilhas** (o script `criar-formularios.gs` já faz isso).
2. Na planilha, **Arquivo → Fazer download → Valores separados por vírgula (.csv)**. Sai só a aba aberta, então exporte uma aba por formulário.
3. Salve como `alunos.csv` e `professores.csv` numa pasta **fora do repositório** (os dados são de pessoas reais, mesmo anônimos).

Não mude os títulos das colunas: o script acha cada pergunta pelo título (ignorando espaços e quebras de linha sobrando, aspas e o código `A3.` do kit) ou por um dos títulos alternativos registrados em `questoes.py`.

### Formulário publicado x kit

O formulário de alunos publicado em 19/10/2026 ficou diferente do kit, e o script entende os dois formatos:

| No publicado | Como o script trata |
| --- | --- |
| Títulos sem código (`A1.`) e com espaços sobrando | Compara pelo título normalizado |
| Consentimento em duas perguntas ("Consentimento" e "Você pode participar?") | Fica quem marcou "Sim" na primeira e não respondeu "Não..." na segunda |
| A3 virou escolha única ("qual item é mais difícil") | Conta como A4; a grade A3 não existe, então o H1 usa só o critério "≥25% escolheram ABNT" e o relatório avisa |
| Pergunta extra sobre o grau de dificuldade | Aparece como A4G no relatório |
| Concordância como escala 1 a 5 | 4 = Concordo, 5 = Concordo totalmente |
| Opção "Resumo e palavras-chave · Figuras e tabelas" juntada | Contada como opção própria, não como texto livre |
| Campo "Comentários e/ou perguntas" | Vai para o anexo de respostas abertas (A0) |

O formulário de professores também saiu diferente do kit (conferido em 14/11/2026):

| No publicado | Como o script trata |
| --- | --- |
| A planilha de respostas chama-se "RSVP do evento (respostas)" (o formulário nasceu de um modelo de RSVP) | Nada muda na análise; vale renomear a planilha para "Threshold — respostas dos professores" para ninguém se perder |
| P3 (grade "quanto cada item consome do seu tempo") virou caixas de seleção | Não é analisável como grade: o relatório marca a P3 como sem dados |
| Concordância como escala 1 a 5 | 4 = Concordo, 5 = Concordo totalmente |
| Sem pergunta de consentimento separada | Todas as respostas entram; o texto de abertura do formulário é o registro do consentimento |

### Privacidade na análise

- **Colunas que identificam pessoas** (nome, e-mail, telefone, matrícula, CPF...) são descartadas logo na leitura, antes de qualquer conta. O relatório só diz o título da coluna e quantas células estavam preenchidas, nunca o conteúdo.
- **Respostas abertas** saem com e-mail, CPF e telefone tarjados. Nomes próprios não dá para detectar com segurança: confira à mão antes de citar.
- Rode sempre com o CSV e a pasta de saída **fora do repositório**.

## 2. Rodar

```bash
cd analise
pip install -r requirements.txt
python3 analisar.py --alunos ~/validacao/alunos.csv --professores ~/validacao/professores.csv --saida ~/validacao/resultados
```

Também aceita só um dos arquivos (as hipóteses que dependem do outro grupo saem como "Dados insuficientes").

## 3. O que sai

| Arquivo | Conteúdo |
| --- | --- |
| `relatorio.md` | Amostra, tabela de vereditos H1–H6 (evidência numérica e decisão de produto), cada pergunta com gráfico e tabela, anexo com as respostas abertas e a ressalva metodológica |
| `graficos/*.png` | Um gráfico de barras por pergunta fechada (âmbar destaca o item ABNT na A3 e na A4) |
| `resumo.json` | Os mesmos números em formato de máquina |

### Como ler

- **Top-2**: percentual de "Concordo" + "Concordo totalmente" nas escalas de concordância.
- **Grades (A3, P3)**: média de 1 a 5 por item e percentual de notas 4 e 5.
- **Caixas de seleção**: cada pessoa marca várias, então a soma passa de 100%.
- **Vereditos**: Confirmada, Não confirmada ou Dados insuficientes. Os limites são inclusivos onde o kit diz "60% ou mais" e exclusivos onde diz "menos de".
- **Aviso de amostra**: com menos de 30 alunos ou 5 professores, o relatório pede para tratar o resultado como evidência exploratória.

O script remove quem não deu consentimento e, no formulário de professores, quem marcou "Nunca orientei".

## Testes

```bash
python3 -m pytest -q
```

Os testes cobrem o parsing das caixas de seleção (opções com vírgula, como "Formatação (margens, fonte, espaçamento)", e texto livre), os filtros, o cálculo do top-2, os limites de cada critério e uma execução ponta a ponta. Também conferem se os títulos batem com `scripts/criar-formularios.gs`.

## Dados fictícios

`gerar_dados_teste.py` cria `fixtures/FICTICIO_respostas_alunos.csv` e `FICTICIO_respostas_professores.csv` (seed fixa, 40 alunos e 8 professores inventados, no formato do kit). `fixtures/FICTICIO_respostas_alunos_publicado.csv` imita o formulário publicado: cabeçalhos reais, 6 respostas inventadas, incluindo um nome, um e-mail e um telefone falsos para testar o descarte. `fixtures/resultado-exemplo/` mostra a saída com esses dados. **Nada ali é resposta real.**
