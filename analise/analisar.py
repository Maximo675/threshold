#!/usr/bin/env python3
"""Análise das respostas dos questionários de validação do Threshold.

Uso:
    python3 analisar.py --alunos alunos.csv --professores professores.csv --saida resultados/

Aceita só um dos dois arquivos. Gera, na pasta de saída:
    relatorio.md   relatório em português, com vereditos das hipóteses H1–H6
    graficos/*.png um gráfico por pergunta fechada
    resumo.json    números e vereditos em formato de máquina

Critérios: seção "Como analisar" de docs/02-kit-de-validacao.md (definidos ANTES da coleta).
"""
from __future__ import annotations

import argparse
import json
import math
import re
import textwrap
from pathlib import Path

import pandas as pd

import questoes as Q

CONFIRMADA = "Confirmada"
NAO_CONFIRMADA = "Não confirmada"
INSUFICIENTE = "Dados insuficientes"


# ---------------------------------------------------------------------------
# Leitura e limpeza
# ---------------------------------------------------------------------------

def ler_csv(caminho: str | Path) -> pd.DataFrame:
    """Lê o CSV exportado do Google Sheets (UTF-8, com ou sem BOM), tudo como texto."""
    df = pd.read_csv(caminho, dtype=str, encoding="utf-8-sig", keep_default_na=False)
    df.columns = [str(c).strip() for c in df.columns]
    return df.apply(lambda col: col.str.strip())


def normalizar(titulo: str) -> str:
    """Título comparável: sem código ('A3. '), aspas retas, espaços únicos, minúsculas.

    O formulário publicado tem espaços e quebras de linha sobrando nos títulos e não usa os códigos do kit.
    """
    t = str(titulo).replace("\u201c", '"').replace("\u201d", '"')
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"^[AP]\d+[A-Z]?\.\s*", "", t)
    t = re.sub(r"\s+\?", "?", t)
    return t.casefold()


def titulos_aceitos(q: dict) -> list[str]:
    return [q["titulo"], *q.get("aliases", [])]


def coluna(df: pd.DataFrame, codigo: str, titulo: str, aliases: list[str] | None = None) -> str | None:
    """Acha a coluna da pergunta: título exato, depois título normalizado (ou um alias), depois prefixo 'A3.'."""
    if titulo in df.columns:
        return titulo
    simples = [c for c in df.columns if "[" not in c]  # colunas de grade ('Título [linha]') ficam de fora
    procurados = {normalizar(t) for t in [titulo, *(aliases or [])]}
    for c in simples:
        if normalizar(c) in procurados:
            return c
    prefixo = codigo + "."
    candidatas = [c for c in simples if c.startswith(prefixo)]
    return candidatas[0] if candidatas else None


def colunas_conhecidas(df: pd.DataFrame, definicoes: dict) -> set[str]:
    """Todas as colunas que o script sabe interpretar (perguntas, grades, consentimento, data/hora)."""
    conhecidas = {c for c in df.columns if c == "Carimbo de data/hora" or c in Q.COLUNAS_CONSENTIMENTO}
    for cod, q in definicoes.items():
        if q["tipo"] == "grade":
            conhecidas |= set(colunas_grade(df, cod, q["titulo"], q["linhas"]).values())
        else:
            col = coluna(df, cod, q["titulo"], q.get("aliases"))
            if col:
                conhecidas.add(col)
    return conhecidas


def remover_identificacao(df: pd.DataFrame, definicoes: dict) -> tuple[pd.DataFrame, list[dict]]:
    """Descarta colunas que identificam pessoas (nome, e-mail, telefone...) ANTES de qualquer análise.

    Só olha colunas que não são perguntas conhecidas (a A15 diz "sem citar nomes" e precisa ficar).
    Devolve (df sem essas colunas, [{coluna, preenchidas}]): o relatório mostra o título e a contagem,
    nunca o conteúdo.
    """
    conhecidas = colunas_conhecidas(df, definicoes)
    padrao = re.compile(Q.PADRAO_IDENTIFICACAO, re.IGNORECASE)
    fora = [c for c in df.columns if c not in conhecidas and padrao.search(c)]
    info = [{"coluna": re.sub(r"\s+", " ", c).strip(), "preenchidas": int((df[c] != "").sum())} for c in fora]
    return df.drop(columns=fora), info


def colunas_ignoradas(df: pd.DataFrame, definicoes: dict) -> list[str]:
    conhecidas = colunas_conhecidas(df, definicoes)
    return [re.sub(r"\s+", " ", c).strip() for c in df.columns if c not in conhecidas]


_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
_TELEFONE = re.compile(r"(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}")
_CPF = re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")


def tarjar(texto: str) -> str:
    """Tira e-mail, CPF e telefone de respostas abertas. Nomes próprios só um humano confere (aviso no relatório)."""
    texto = _EMAIL.sub("[e-mail removido]", texto)
    texto = _CPF.sub("[CPF removido]", texto)
    return _TELEFONE.sub("[telefone removido]", texto)


def colunas_grade(df: pd.DataFrame, codigo: str, titulo: str, linhas: list[str]) -> dict[str, str]:
    """Mapeia cada linha da grade para a coluna 'Título [linha]' do CSV."""
    mapa = {}
    for linha in linhas:
        exata = f"{titulo} [{linha}]"
        if exata in df.columns:
            mapa[linha] = exata
            continue
        for c in df.columns:
            if c.startswith(codigo + ".") and c.endswith(f"[{linha}]"):
                mapa[linha] = c
                break
    return mapa


def filtrar_consentimento(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Mantém só quem consentiu. Devolve (df, removidos).

    Kit: 'Sim, concordo em participar'. Formulário publicado: 'Sim' em "Consentimento" e uma segunda
    pergunta ("Você pode participar?"), em que qualquer resposta começando com "Não" remove a pessoa.
    """
    ok = pd.Series(True, index=df.index)
    for col in Q.COLUNAS_CONSENTIMENTO:
        if col not in df.columns:
            continue
        valores = df[col].str.strip().str.casefold()
        if col == "Você pode participar?":
            ok &= ~valores.str.startswith("não") & (valores != "")
        else:
            ok &= valores.str.startswith("sim")
    return df[ok].copy(), int((~ok).sum())


def filtrar_nunca_orientou(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    col = coluna(df, "P1", Q.PROFESSORES["P1"]["titulo"])
    if not col:
        return df, 0
    fora = df[col] == Q.NUNCA_ORIENTOU
    return df[~fora].copy(), int(fora.sum())


def separar_caixas(celula: str, opcoes: list[str]) -> tuple[list[str], list[str]]:
    """Separa uma célula de caixas de seleção nas opções marcadas.

    O Forms junta as opções com ', ', mas várias opções têm vírgula dentro
    (ex.: 'Formatação (margens, fonte, espaçamento)'), então NÃO dá para dar split.
    Percorre a célula casando as opções conhecidas (a mais longa primeiro) só em
    fronteiras de item (início da célula ou depois de ', ', e seguidas de ', ' ou fim).
    O que sobrar vira texto livre (ex.: resposta 'Outro' digitada).
    Devolve (opções_marcadas, textos_livres).
    """
    if not isinstance(celula, str) or not celula.strip():
        return [], []
    texto = celula.strip()
    ordenadas = sorted(opcoes, key=len, reverse=True)
    marcadas, livres, solto = [], [], ""
    i = 0
    while i < len(texto):
        casou = None
        for op in ordenadas:
            fim = i + len(op)
            if texto.startswith(op, i) and (fim == len(texto) or texto.startswith(", ", fim)):
                casou = op
                break
        if casou:
            if solto.strip(" ,"):
                livres.append(solto.strip(" ,"))
            solto = ""
            if casou not in marcadas:
                marcadas.append(casou)
            i += len(casou)
            if texto.startswith(", ", i):
                i += 2
        else:
            prox = texto.find(", ", i)
            if prox == -1:
                solto += texto[i:]
                i = len(texto)
            else:
                solto += texto[i:prox + 2]
                i = prox + 2
    if solto.strip(" ,"):
        livres.append(solto.strip(" ,"))
    return marcadas, livres


def nota(valor: str) -> float | None:
    """'5 - Muito difícil' -> 5; '3' -> 3; vazio -> None."""
    if not isinstance(valor, str):
        return None
    m = re.match(r"\s*(\d+)", valor)
    return float(m.group(1)) if m else None


# ---------------------------------------------------------------------------
# Estatísticas por tipo de pergunta
# ---------------------------------------------------------------------------

def pct(parte: int, total: int) -> float | None:
    return None if total == 0 else parte / total


def resumo_multipla(serie: pd.Series, opcoes: list[str]) -> dict:
    validas = serie[serie != ""]
    n = len(validas)
    contagem = {op: int((validas == op).sum()) for op in opcoes}
    outras = sorted(set(validas) - set(opcoes))
    for o in outras:
        contagem[o] = int((validas == o).sum())
    return {"n": n, "contagem": contagem, "pct": {k: pct(v, n) for k, v in contagem.items()}}


def resumo_caixas(serie: pd.Series, opcoes: list[str]) -> dict:
    validas = serie[serie != ""]
    n = len(validas)
    contagem = {op: 0 for op in opcoes}
    livres = []
    for cel in validas:
        marcadas, extra = separar_caixas(cel, opcoes + list(Q.SINONIMOS))
        for m in dict.fromkeys(Q.SINONIMOS.get(m, m) for m in marcadas):
            if m in contagem:
                contagem[m] += 1
            else:
                extra.append(m)
        livres.extend(extra)
    return {"n": n, "contagem": contagem, "pct": {k: pct(v, n) for k, v in contagem.items()},
            "texto_livre": livres}


def como_concordancia(valor: str) -> str:
    """Formulário publicado usa escala linear 1–5 (1 = discordo totalmente, 5 = concordo totalmente)."""
    v = str(valor).strip()
    if v in Q.CONCORDANCIA:
        return v
    n = nota(v)
    return Q.CONCORDANCIA[int(n) - 1] if n is not None and 1 <= n <= 5 else v


def resumo_concordancia(serie: pd.Series) -> dict:
    validas = serie[serie != ""].map(como_concordancia)
    n = len(validas)
    contagem = {op: int((validas == op).sum()) for op in Q.CONCORDANCIA}
    top2 = sum(contagem[o] for o in Q.TOP2)
    return {"n": n, "contagem": contagem, "pct": {k: pct(v, n) for k, v in contagem.items()},
            "top2": pct(top2, n)}


def resumo_numerico(serie: pd.Series) -> dict:
    notas = [x for x in (nota(v) for v in serie) if x is not None]
    n = len(notas)
    dist = {str(k): sum(1 for x in notas if x == k) for k in range(1, 6)}
    return {"n": n, "media": (sum(notas) / n) if n else None,
            "pct_4_5": pct(sum(1 for x in notas if x >= 4), n), "distribuicao": dist}


def resumo_grade(df: pd.DataFrame, codigo: str, q: dict) -> dict:
    mapa = colunas_grade(df, codigo, q["titulo"], q["linhas"])
    linhas = {linha: resumo_numerico(df[col]) for linha, col in mapa.items()}
    return {"linhas": linhas, "faltando": [l for l in q["linhas"] if l not in mapa]}


def analisar_grupo(df: pd.DataFrame, definicoes: dict) -> dict:
    out = {}
    for codigo, q in definicoes.items():
        if q["tipo"] == "grade":
            r = resumo_grade(df, codigo, q)
            out[codigo] = r if r["linhas"] else None  # grade que não existe nesta versão do formulário
            continue
        col = coluna(df, codigo, q["titulo"], q.get("aliases"))
        if col is None:
            out[codigo] = None
            continue
        serie = df[col]
        if q["tipo"] == "multipla":
            out[codigo] = resumo_multipla(serie, q["opcoes"])
        elif q["tipo"] == "caixas":
            out[codigo] = resumo_caixas(serie, q["opcoes"] + q.get("opcoes_extra", []))
        elif q["tipo"] == "concordancia":
            out[codigo] = resumo_concordancia(serie)
        elif q["tipo"] == "escala":
            out[codigo] = resumo_numerico(serie)
        elif q["tipo"] == "paragrafo":
            out[codigo] = {"respostas": [tarjar(v) for v in serie if v]}
    return out


# ---------------------------------------------------------------------------
# Hipóteses (critérios do kit, definidos antes da coleta)
# ---------------------------------------------------------------------------

def _top2(res: dict | None, cod: str):
    r = (res or {}).get(cod)
    return None if not r or r["n"] == 0 else r["top2"]


def _fmt(p):
    return "—" if p is None else f"{p * 100:.0f}%"


def _num(x, casas: int = 2) -> str:
    """Número com vírgula decimal, como se escreve em português."""
    return "—" if x is None else f"{x:.{casas}f}".replace(".", ",")


def _maior(r: dict | None, n: int = 3, ignorar: tuple[str, ...] = ()) -> list[str]:
    if not r or not r.get("n"):
        return []
    itens = sorted(((k, v) for k, v in r["contagem"].items() if k not in ignorar),
                   key=lambda kv: kv[1], reverse=True)
    return [f"{k} ({_fmt(r['pct'][k])})" for k, v in itens[:n] if v > 0]


def avaliar_hipoteses(A: dict | None, P: dict | None) -> list[dict]:
    hs = []

    # H1 — ABNT entre as maiores dores
    a3 = (A or {}).get("A3")
    a4 = (A or {}).get("A4")
    if not a4 or a4["n"] == 0:
        hs.append(dict(id="H1", nome="ABNT é uma das maiores dores", veredito=INSUFICIENTE,
                       evidencia="Faltam respostas da A4.", decisao="Repetir a análise com dados."))
    elif not a3 or not a3["linhas"]:
        # Formulário publicado: sem a grade A3, vale só a metade "≥25% na A4" do critério.
        p_a4 = a4["pct"].get(Q.LINHA_ABNT) or 0
        ok = p_a4 >= 0.25
        ranking = _maior(a4, 3)
        ev = (f"{_fmt(p_a4)} escolheram ABNT como maior dificuldade (critério: ≥25%). A grade A3 não existe no "
              "formulário publicado, então a outra metade do critério (top 3 da A3) não foi avaliada. "
              f"Mais escolhidos: {', '.join(ranking) if ranking else '—'}.")
        if ok:
            a5 = _maior((A or {}).get("A5"), 2, ignorar=("Não tenho dificuldade com ABNT",))
            dec = ("Archivist (revisor ABNT) segue como fatia funcional. Pela A5, começar por: "
                   + (", ".join(a5) if a5 else "sem dados da A5") + ".")
        else:
            dec = ("ABNT não apareceu como maior dificuldade. Discutir com o orientador se a fatia funcional "
                   f"muda para: {ranking[0] if ranking else '—'}. Atenção: sem a A3, este veredito é mais fraco.")
        hs.append(dict(id="H1", nome="ABNT é uma das maiores dores", veredito=CONFIRMADA if ok else NAO_CONFIRMADA,
                       evidencia=ev, decisao=dec))
    else:
        medias = {l: r["media"] for l, r in a3["linhas"].items() if r["media"] is not None}
        ranking = sorted(medias, key=medias.get, reverse=True)
        pos = ranking.index(Q.LINHA_ABNT) + 1 if Q.LINHA_ABNT in ranking else None
        p_a4 = a4["pct"].get(Q.LINHA_ABNT) or 0
        ok = (pos is not None and pos <= 3) or p_a4 >= 0.25
        pos_txt = (f"ABNT é a {pos}ª maior média da A3 ({_num(medias[Q.LINHA_ABNT])} de 5)" if pos
                   else "ABNT sem respostas na A3")
        ev = (f"{pos_txt}; {_fmt(p_a4)} escolheram ABNT como maior dificuldade na A4 "
              "(critério: top 3 OU ≥25%).")
        if ok:
            a5 = _maior((A or {}).get("A5"), 2, ignorar=("Não tenho dificuldade com ABNT",))
            dec = ("Revisor ABNT segue como fatia funcional. Pela A5, começar por: "
                   + (", ".join(a5) if a5 else "sem dados da A5") + ".")
        else:
            dec = f"Trocar a fatia funcional pelo item mais difícil da A3: {ranking[0]} ({_num(medias[ranking[0]])})."
        hs.append(dict(id="H1", nome="ABNT é uma das maiores dores", veredito=CONFIRMADA if ok else NAO_CONFIRMADA,
                       evidencia=ev, decisao=dec))

    # H2 — aluno não sabe o próximo passo
    a6 = (A or {}).get("A6")
    t12 = _top2(A, "A12")
    if not a6 or a6["media"] is None or t12 is None:
        hs.append(dict(id="H2", nome="Aluno não sabe o próximo passo", veredito=INSUFICIENTE,
                       evidencia="Faltam respostas da A6 ou da A12.", decisao="Repetir a análise com dados."))
    else:
        ok = a6["media"] < 3 and t12 >= 0.60
        hs.append(dict(id="H2", nome="Aluno não sabe o próximo passo", veredito=CONFIRMADA if ok else NAO_CONFIRMADA,
                       evidencia=f"Média da A6 = {_num(a6['media'])} (critério < 3); top-2 da A12 = {_fmt(t12)} (critério ≥ 60%).",
                       decisao="Roadmap sobe para funcional no nível \"se sobrar tempo\"." if ok
                       else "Roadmap fica só em tela."))

    # H3 — escolha de orientador sem informação
    t8 = _top2(A, "A8")
    if t8 is None:
        hs.append(dict(id="H3", nome="Escolha de orientador sem informação", veredito=INSUFICIENTE,
                       evidencia="Faltam respostas da A8.", decisao="Repetir a análise com dados."))
    else:
        ok = t8 < 0.50
        a9 = _maior((A or {}).get("A9"), 4, ignorar=("Outro",))
        hs.append(dict(id="H3", nome="Escolha de orientador sem informação", veredito=CONFIRMADA if ok else NAO_CONFIRMADA,
                       evidencia=f"Top-2 da A8 = {_fmt(t8)} (critério < 50%).",
                       decisao=("Perfil de afinidade continua no protótipo. Campos mais pedidos na A9: "
                                + (", ".join(a9) if a9 else "sem dados") + ".") if ok
                       else "Reduzir o perfil a uma vitrine simples."))

    # H4 — IA que orienta é aceita (precisa dos dois grupos)
    t11, t7 = _top2(A, "A11"), _top2(P, "P7")
    if t11 is None or t7 is None:
        hs.append(dict(id="H4", nome="IA que orienta é aceita", veredito=INSUFICIENTE,
                       evidencia=f"Top-2 A11 = {_fmt(t11)}; top-2 P7 = {_fmt(t7)}. É preciso ter os dois grupos.",
                       decisao="Repetir a análise com os dois questionários."))
    else:
        ok = t11 >= 0.60 and t7 >= 0.60
        p8 = _maior((P or {}).get("P8"), 3, ignorar=("Não tenho preocupações", "Outra"))
        hs.append(dict(id="H4", nome="IA que orienta é aceita", veredito=CONFIRMADA if ok else NAO_CONFIRMADA,
                       evidencia=f"Top-2 A11 = {_fmt(t11)}; top-2 P7 = {_fmt(t7)} (critério: os dois ≥ 60%).",
                       decisao=("Manter a proposta. Salvaguardas a tratar no TCC (P8): "
                                + (", ".join(p8) if p8 else "sem dados") + ".") if ok
                       else "Rever a proposta de IA com o orientador."))

    # H5 — professores aceitam o perfil
    t9, t10 = _top2(P, "P9"), _top2(P, "P10")
    if t9 is None:
        hs.append(dict(id="H5", nome="Professores aceitam o perfil", veredito=INSUFICIENTE,
                       evidencia="Faltam respostas da P9.", decisao="Repetir a análise com dados."))
    else:
        ok = t9 >= 0.60
        if ok:
            fb = (t10 is not None and t10 >= 0.60)
            dec = ("Perfil fica. Feedback agregado " + ("ENTRA" if fb else "NÃO entra")
                   + f" (top-2 P10 = {_fmt(t10)}, critério ≥ 60%).")
        else:
            dec = "Perfil vira opcional e sem feedback."
        hs.append(dict(id="H5", nome="Professores aceitam o perfil", veredito=CONFIRMADA if ok else NAO_CONFIRMADA,
                       evidencia=f"Top-2 P9 = {_fmt(t9)} (critério ≥ 60%).", decisao=dec))

    # H6 — segurança pesa na decisão (precisa dos dois grupos)
    t13, t12p = _top2(A, "A13"), _top2(P, "P12")
    if t13 is None or t12p is None:
        hs.append(dict(id="H6", nome="Segurança pesa na decisão", veredito=INSUFICIENTE,
                       evidencia=f"Top-2 A13 = {_fmt(t13)}; top-2 P12 = {_fmt(t12p)}. É preciso ter os dois grupos.",
                       decisao="Repetir a análise com os dois questionários."))
    else:
        ok = t13 >= 0.60 and t12p >= 0.60
        a14 = _maior((A or {}).get("A14"), 6, ignorar=("Nenhuma dessas",))
        hs.append(dict(id="H6", nome="Segurança pesa na decisão", veredito=CONFIRMADA if ok else NAO_CONFIRMADA,
                       evidencia=f"Top-2 A13 = {_fmt(t13)}; top-2 P12 = {_fmt(t12p)} (critério: os dois ≥ 60%).",
                       decisao=("Reforça a segurança como pilar. Dados que os alunos aceitam informar (A14): "
                                + (", ".join(a14) if a14 else "sem dados") + ".") if ok
                       else "Segurança segue igual, mas com menos destaque na apresentação."))
    return hs


# ---------------------------------------------------------------------------
# Gráficos
# ---------------------------------------------------------------------------

COR = "#4C6A92"
COR_DESTAQUE = "#C98A1B"


def _grafico_barras(rotulos, valores, titulo, caminho, formato="pct", destaque=None, max_x=None):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    rot = ["\n".join(textwrap.wrap(r, 38, break_on_hyphens=False)) for r in rotulos]
    altura = max(2.2, 0.55 * len(rot) + 1.2)
    fig, ax = plt.subplots(figsize=(8, altura), dpi=150)
    cores = [COR_DESTAQUE if destaque and r == destaque else COR for r in rotulos]
    y = list(range(len(rot)))[::-1]
    ax.barh(y, valores, color=cores, height=0.6)
    ax.set_yticks(y, rot, fontsize=9)
    ax.set_title("\n".join(textwrap.wrap(titulo, 70, break_on_hyphens=False)), fontsize=10, loc="left")
    ax.spines[["top", "right"]].set_visible(False)
    limite = max_x if max_x is not None else (max(valores + [0]) * 1.18 or 1)
    ax.set_xlim(0, limite)
    for yi, v in zip(y, valores):
        txt = f"{v * 100:.0f}%" if formato == "pct" else f"{v:.2f}".replace(".", ",")
        ax.text(v + limite * 0.01, yi, txt, va="center", fontsize=8.5)
    ax.tick_params(axis="x", labelsize=8)
    if formato == "pct":
        ax.xaxis.set_major_formatter(matplotlib.ticker.PercentFormatter(1.0, decimals=0))
    fig.tight_layout()
    fig.savefig(caminho)
    plt.close(fig)


def gerar_graficos(res: dict, definicoes: dict, pasta: Path) -> dict[str, str]:
    pasta.mkdir(parents=True, exist_ok=True)
    feitos = {}
    for cod, q in definicoes.items():
        r = res.get(cod)
        if not r:
            continue
        arq = pasta / f"{cod}.png"
        if q["tipo"] in ("multipla", "caixas") and r["n"]:
            ops = list(r["contagem"].keys())
            _grafico_barras(ops, [r["pct"][o] or 0 for o in ops], q["titulo"], arq,
                            destaque=Q.LINHA_ABNT if cod == "A4" else None)
        elif q["tipo"] == "concordancia" and r["n"]:
            _grafico_barras(Q.CONCORDANCIA, [r["pct"][o] or 0 for o in Q.CONCORDANCIA], q["titulo"], arq)
        elif q["tipo"] == "escala" and r["n"]:
            ks = [str(k) for k in range(1, 6)]
            rot = [f"{k}" + (f" ({q['rotulos'][0]})" if k == "1" else f" ({q['rotulos'][1]})" if k == "5" else "")
                   for k in ks]
            _grafico_barras(rot, [r["distribuicao"][k] / r["n"] for k in ks], q["titulo"], arq)
        elif q["tipo"] == "grade" and r["linhas"]:
            ls = [l for l in q["linhas"] if l in r["linhas"] and r["linhas"][l]["media"] is not None]
            if not ls:
                continue
            _grafico_barras(ls, [r["linhas"][l]["media"] for l in ls], q["titulo"] + " (média de 1 a 5)", arq,
                            formato="num", destaque=Q.LINHA_ABNT if cod == "A3" else None, max_x=5.6)
        else:
            continue
        feitos[cod] = f"graficos/{arq.name}"
    return feitos


# ---------------------------------------------------------------------------
# Relatório
# ---------------------------------------------------------------------------

def _tabela_pergunta(cod: str, q: dict, r: dict) -> list[str]:
    linhas = []
    if q["tipo"] in ("multipla", "caixas", "concordancia"):
        linhas += ["| Opção | Respostas | % |", "| --- | --- | --- |"]
        for op, c in r["contagem"].items():
            linhas.append(f"| {op} | {c} | {_fmt(r['pct'][op])} |")
        extra = f"n = {r['n']}"
        if q["tipo"] == "caixas":
            extra += " (cada pessoa podia marcar várias; a soma passa de 100%)"
        if q["tipo"] == "concordancia":
            extra += f" · top-2 (Concordo + Concordo totalmente) = **{_fmt(r['top2'])}**"
            extra += " · na escala numérica 1–5 do formulário publicado, 4 = Concordo e 5 = Concordo totalmente"
        linhas += ["", extra]
        if q["tipo"] == "caixas" and r.get("texto_livre"):
            linhas += ["", "Texto livre: " + "; ".join(f"\"{t}\"" for t in r["texto_livre"])]
    elif q["tipo"] == "escala":
        linhas += ["| Nota | Respostas |", "| --- | --- |"]
        for k, v in r["distribuicao"].items():
            linhas.append(f"| {k} | {v} |")
        media = _num(r["media"])
        linhas += ["", f"n = {r['n']} · média = **{media}** · notas 4–5 = {_fmt(r['pct_4_5'])}"]
    elif q["tipo"] == "grade":
        linhas += ["| Item | Média (1–5) | Notas 4–5 | n |", "| --- | --- | --- | --- |"]
        ordem = sorted(r["linhas"].items(), key=lambda kv: (kv[1]["media"] or 0), reverse=True)
        for l, s in ordem:
            media = _num(s["media"])
            linhas.append(f"| {l} | {media} | {_fmt(s['pct_4_5'])} | {s['n']} |")
        if r["faltando"]:
            linhas += ["", "Linhas não encontradas no CSV: " + ", ".join(r["faltando"])]
    return linhas


def montar_relatorio(meta: dict, A: dict | None, P: dict | None, hs: list[dict], graficos: dict) -> str:
    L = ["# Threshold — Resultado da validação", ""]
    L += [f"Gerado por `analise/analisar.py` em {meta['gerado_em']}. Critérios definidos antes da coleta "
          "(docs/02-kit-de-validacao.md, seção \"Como analisar\").", ""]
    L += ["## Amostra", "", "| Grupo | Respostas válidas | Removidas |", "| --- | --- | --- |"]
    for g in ("alunos", "professores"):
        m = meta.get(g)
        if m:
            L.append(f"| {g.capitalize()} | {m['validas']} | {m['removidas_descricao']} |")
        else:
            L.append(f"| {g.capitalize()} | arquivo não informado | — |")
    L.append("")
    avisos = []
    if meta.get("alunos") and meta["alunos"]["validas"] < Q.MIN_ALUNOS:
        avisos.append(f"menos de {Q.MIN_ALUNOS} alunos")
    if meta.get("professores") and meta["professores"]["validas"] < Q.MIN_PROFESSORES:
        avisos.append(f"menos de {Q.MIN_PROFESSORES} professores")
    if avisos:
        L += [f"> **Atenção:** {' e '.join(avisos)}. Trate o resultado como evidência exploratória "
              "e diga isso no texto do TCC.", ""]
    for g in ("alunos", "professores"):
        m = meta.get(g) or {}
        for c in m.get("removidas_por_privacidade", []):
            L += [f"> **Privacidade ({g}):** a coluna \"{c['coluna']}\" identifica pessoas e foi descartada na "
                  f"leitura ({c['preenchidas']} célula(s) preenchida(s)). O conteúdo não aparece neste relatório. "
                  "Apague-a também da planilha original.", ""]
        if m.get("ignoradas"):
            L += [f"Colunas sem pergunta correspondente ({g}), ignoradas: "
                  + "; ".join(f"\"{c}\"" for c in m["ignoradas"]) + ".", ""]
        if m.get("faltando"):
            L += [f"Perguntas do kit que não estão no CSV ({g}): {', '.join(m['faltando'])}.", ""]
    L += ["## Hipóteses", "", "| # | Hipótese | Veredito | Evidência | Decisão de produto |",
          "| --- | --- | --- | --- | --- |"]
    for h in hs:
        L.append(f"| {h['id']} | {h['nome']} | **{h['veredito']}** | {h['evidencia']} | {h['decisao']} |")
    L.append("")

    for titulo, res, defs in (("Alunos", A, Q.ALUNOS), ("Professores", P, Q.PROFESSORES)):
        if res is None:
            continue
        L += [f"## Respostas dos {titulo.lower()}", ""]
        for cod, q in defs.items():
            r = res.get(cod)
            if q["tipo"] == "paragrafo" or (r is None and q.get("so_publicado")):
                continue
            L += [f"### {q['titulo']}", ""]
            if r is None:
                L += ["Pergunta não encontrada no CSV (pode não existir nesta versão do formulário).", ""]
                continue
            if cod in graficos:
                L += [f"![{cod}]({graficos[cod]})", ""]
            L += _tabela_pergunta(cod, q, r) + [""]

    L += ["## Anexo: respostas abertas", "",
          "Lista completa para o mapa de afinidade (agrupar por tema à mão). E-mails, CPFs e telefones já saem "
          "tarjados; nomes próprios, não. Antes de citar no TCC, confira se nenhuma resposta identifica alguém.", ""]
    for res, cod, defs in ((A, "A0", Q.ALUNOS), (A, "A15", Q.ALUNOS), (P, "P13", Q.PROFESSORES)):
        if res is None or not res.get(cod):
            continue
        resp = res[cod]["respostas"]
        L += [f"### {defs[cod]['titulo']} ({len(resp)} respostas)", ""]
        L += [f"{i}. {t}" for i, t in enumerate(resp, 1)] or ["Nenhuma resposta."]
        L.append("")
    L += ["## Ressalva", "",
          "A amostra é de conveniência (divulgação em grupos de turma e convite a professores) e não representa "
          "toda a universidade. O resultado orienta decisões de produto e não permite generalizar.", ""]
    return "\n".join(L)


def _limpar_json(obj):
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, dict):
        return {k: _limpar_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_limpar_json(v) for v in obj]
    return obj


def executar(alunos: str | None, professores: str | None, saida: str | Path) -> dict:
    from datetime import datetime

    saida = Path(saida)
    saida.mkdir(parents=True, exist_ok=True)
    meta = {"gerado_em": datetime.now().strftime("%d/%m/%Y %H:%M")}
    A = P = None
    def preparar(caminho, definicoes):
        df = ler_csv(caminho)
        df, privacidade = remover_identificacao(df, definicoes)  # primeiro passo, sempre
        info = {"removidas_por_privacidade": privacidade, "ignoradas": colunas_ignoradas(df, definicoes)}
        return df, info

    if alunos:
        df, info = preparar(alunos, Q.ALUNOS)
        total = len(df)
        df, sem = filtrar_consentimento(df)
        A = analisar_grupo(df, Q.ALUNOS)
        info["faltando"] = [c for c, q in Q.ALUNOS.items() if A.get(c) is None and not q.get("so_publicado")]
        meta["alunos"] = {"total": total, "validas": len(df), "sem_consentimento": sem,
                          "removidas_descricao": f"{sem} sem consentimento", **info}
    if professores:
        df, info = preparar(professores, Q.PROFESSORES)
        total = len(df)
        df, sem = filtrar_consentimento(df)
        df, nunca = filtrar_nunca_orientou(df)
        P = analisar_grupo(df, Q.PROFESSORES)
        info["faltando"] = [c for c, q in Q.PROFESSORES.items() if P.get(c) is None and not q.get("so_publicado")]
        meta["professores"] = {"total": total, "validas": len(df), "sem_consentimento": sem, "nunca_orientou": nunca,
                               "removidas_descricao": f"{sem} sem consentimento, {nunca} nunca orientaram", **info}
    hs = avaliar_hipoteses(A, P)
    graficos = {}
    if A:
        graficos.update(gerar_graficos(A, Q.ALUNOS, saida / "graficos"))
    if P:
        graficos.update(gerar_graficos(P, Q.PROFESSORES, saida / "graficos"))
    (saida / "relatorio.md").write_text(montar_relatorio(meta, A, P, hs, graficos), encoding="utf-8")
    resumo = _limpar_json({"meta": meta, "hipoteses": hs, "alunos": A, "professores": P})
    (saida / "resumo.json").write_text(json.dumps(resumo, ensure_ascii=False, indent=2), encoding="utf-8")
    return resumo


def main(argv=None):
    ap = argparse.ArgumentParser(description="Analisa os questionários de validação do Threshold.")
    ap.add_argument("--alunos", help="CSV exportado do formulário de alunos")
    ap.add_argument("--professores", help="CSV exportado do formulário de professores")
    ap.add_argument("--saida", default="resultados", help="pasta de saída (padrão: resultados/)")
    args = ap.parse_args(argv)
    if not args.alunos and not args.professores:
        ap.error("informe --alunos e/ou --professores")
    resumo = executar(args.alunos, args.professores, args.saida)
    for h in resumo["hipoteses"]:
        print(f"{h['id']} · {h['veredito']}: {h['evidencia']}")
    print(f"\nRelatório: {Path(args.saida) / 'relatorio.md'}")


if __name__ == "__main__":
    main()
