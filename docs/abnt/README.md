# Base ABNT da Lantern

> Versão 0.1 · consulta às fontes em 19/10/2026 · foco: NBR 6023:2018 (referências)

Esta pasta guarda o conhecimento que o **Archivist** (agente revisor ABNT do Threshold, que fala pela voz da Lantern) consulta para revisar referências. O modelo de IA **não** responde de memória: antes de cada revisão, a API carrega as regras desta base (RAG) e as entrega ao Archivist junto com a referência do aluno (`apps/api/src/lantern/base-abnt.ts`). Cada correção cita o id da regra usada (ex.: `REF-TITULO-01`).

## Arquivos

| Arquivo | Para que serve |
| --- | --- |
| [`nbr6023-regras.md`](nbr6023-regras.md) | Regras em texto, para a equipe ler e revisar |
| [`../../data/abnt/nbr6023-regras.json`](../../data/abnt/nbr6023-regras.json) | As mesmas regras em JSON, para indexar na base vetorial (pgvector) |
| [`../../data/abnt/casos-de-teste.json`](../../data/abnt/casos-de-teste.json) | Casos para medir se a Lantern acerta (entrada → saída esperada + regras violadas) |
| [`../../data/abnt/validar_base.py`](../../data/abnt/validar_base.py) | Valida os dois JSON (ids únicos, regras existentes, consistência dos casos) |

Rode a validação sempre que mudar algo: `python3 data/abnt/validar_base.py`.

## Regra de direitos autorais

As normas da ABNT são protegidas por direitos autorais. Por isso esta base:

- explica as regras **com palavras da equipe**, sem copiar o texto da norma nem trechos longos de guias;
- usa **apenas exemplos inventados** (autores, títulos, editoras, leis e DOIs fictícios, como "Editora Exemplo" e o município "Exemplópolis");
- aponta, em cada regra, os guias de bibliotecas universitárias consultados, para o leitor ir à fonte.

## Convenções

- **Destaque tipográfico** (negrito, itálico ou sublinhado) é representado por `**assim**`. A NBR 6023 aceita qualquer um dos três, desde que o trabalho use sempre o mesmo.
- **Ids estáveis:** `REF-<TEMA>-<NN>`. Nunca reaproveite um id apagado; crie um novo.
- **`tipo_documento`** nas regras: `geral`, `capitulo`, `artigo`, `online`, `academico`, `legislacao`. Nos casos de teste também aparecem `livro`, `entidade` e `sem_autoria`.
- **Dados que o aluno não informou** (data de acesso, ementa de uma lei) aparecem na saída esperada entre colchetes, como `[dia mês abreviado ano]`. A Lantern deve **pedir** esses dados, nunca inventar.

## Como adicionar uma regra

1. Confirme a regra em pelo menos um guia universitário atualizado pela NBR 6023:2018 e abra a página (não confie em snippet de busca).
2. Escreva a regra no JSON com id novo, explicação curta em linguagem de aluno, exemplo errado e certo inventados e a fonte.
3. Copie a regra para `nbr6023-regras.md`.
4. Crie pelo menos um caso de teste que viole a regra.
5. Rode `validar_base.py`.

## Como adicionar um caso de teste

Cada caso tem `entrada` (o que o aluno colou), `saida_esperada` (a referência corrigida) e `regras_violadas` (ids). Caso já correto: `regras_violadas` vazio e `saida_esperada` igual à `entrada`. Isso mede se a Lantern **não** inventa correções, um erro tão grave quanto deixar passar um problema.

## Pontos em que as fontes divergem

- **Destaque:** UFV e Unicamp aceitam negrito, itálico ou sublinhado; o guia da UFMG cita só itálico ou negrito.
- **TCC:** o ano de depósito antes da natureza do trabalho aparece nos modelos de UFU, UNESP e UFMG, mas não no da UFV. O folheto da UNESP também alterna entre "Trabalho de Conclusão do Curso" e "de Curso". A base adota "Trabalho de Conclusão de Curso" com o ano de depósito.
- **Orientador e número de folhas** em trabalhos acadêmicos: a UFU trata como opcionais; o modelo da UFV os inclui.
- **Ementa em legislação:** a UFMG trata como elemento opcional (se usada, em todas as referências de legislação); os demais guias a mostram nos exemplos.
- **DOI:** só os guias da UFMG e da UFU tratam; UFV, Unicamp e UNESP não mencionam.
- **Maio:** não aparece abreviado nos exemplos da UFU, mas nenhum guia consultado explica a regra por escrito.
- **[S. l.: s. n.]:** a UFU mostra em itálico; os demais, sem itálico. A base usa sem itálico.

Vale confirmar esses pontos com o orientador ou a biblioteca da UniCuritiba.

## Fontes consultadas (19/10/2026)

- [UFV — Normalização de trabalhos acadêmicos (2025)](https://www.bbt.ufv.br/wp-content/uploads/2025/01/Normalizacao-de-trabalhos-academicos-2025.pdf)
- [UFU — Referências (out. 2024)](https://bibliotecas.ufu.br/sites/bibliotecas.ufu.br/files/media/imagem/referencias_30_out._2024_1.pdf)
- [Unicamp/Labjor — Guia NBR 6023 (2023)](https://www.labjor.unicamp.br/wp-content/uploads/2023/10/guia_nbr6023_final.pdf)
- [UNESP/FCA — Modelos de referências e citações (2023)](https://fca.unesp.br/Home/Biblioteca/folheto---modelos-de-referencias-e-citacoes-2023.pdf)
- [UFMG/Arquitetura — Referência (set. 2023)](https://sites.arq.ufmg.br/biblioteca/wp-content/uploads/2023/09/Referência-21set2023.pdf)
