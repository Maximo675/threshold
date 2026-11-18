#!/usr/bin/env python3
"""Gera CSVs FICTÍCIOS no formato de exportação do Google Forms, para testar a análise.

NÃO são respostas reais. Seed fixa, então o resultado é sempre o mesmo.
Uso: python3 gerar_dados_teste.py  (grava em fixtures/)
"""
import csv
import random
from pathlib import Path

import questoes as Q

PASTA = Path(__file__).parent / "fixtures"
ARQ_ALUNOS = PASTA / "FICTICIO_respostas_alunos.csv"
ARQ_PROFESSORES = PASTA / "FICTICIO_respostas_professores.csv"
CARIMBO = "Carimbo de data/hora"


def cabecalho(defs):
    cols = [CARIMBO, Q.CONSENTIMENTO]
    for q in defs.values():
        if q["tipo"] == "grade":
            cols += [f"{q['titulo']} [{l}]" for l in q["linhas"]]
        else:
            cols.append(q["titulo"])
    return cols


def resposta(rng, q, pesos=None):
    t = q["tipo"]
    if t == "multipla":
        return rng.choices(q["opcoes"], weights=pesos)[0]
    if t == "caixas":
        k = rng.randint(1, 3)
        escolhidas = rng.sample(q["opcoes"], k)
        return ", ".join(o for o in q["opcoes"] if o in escolhidas)  # Forms mantém a ordem das opções
    if t == "concordancia":
        return rng.choices(Q.CONCORDANCIA, weights=pesos or [1, 1, 2, 4, 3])[0]
    if t == "escala":
        return str(rng.choices([1, 2, 3, 4, 5], weights=pesos or [3, 4, 3, 2, 1])[0])
    if t == "paragrafo":
        return rng.choice(["", "", "Um lugar que diga o que falta em cada etapa.",
                           "Revisar as referências, que sempre volta com correção.",
                           "Saber antes quem orienta qual tema."])
    raise ValueError(t)


def linha_grade(rng, q, viés):
    vals = []
    for l in q["linhas"]:
        base = viés.get(l, 3)
        v = min(5, max(1, round(rng.gauss(base, 1))))
        vals.append(q["colunas"][v - 1])
    return vals


def gerar_alunos(n=40, seed=42):
    rng = random.Random(seed)
    cols = cabecalho(Q.ALUNOS)
    linhas = []
    for i in range(n):
        if i == 7:  # um aluno que NÃO consentiu: o resto fica vazio
            linhas.append([f"20/10/2026 10:{i:02d}:00", Q.NAO_CONSENTIU] + [""] * (len(cols) - 2))
            continue
        row = [f"20/10/2026 10:{i:02d}:00", Q.CONSENTIU]
        for cod, q in Q.ALUNOS.items():
            if q["tipo"] == "grade":
                row += linha_grade(rng, q, {"Aplicar as normas ABNT": 4.2, "Saber qual é o próximo passo": 3.6,
                                            "Escrever o conteúdo": 3.9})
            elif cod == "A4":
                row.append(resposta(rng, q, [1, 1, 3, 2, 1, 2, 1]))
            else:
                row.append(resposta(rng, q))
        linhas.append(row)
    # Garante casos de borda nas caixas: opções com vírgula e texto livre em "Outro"
    idx = {c: i for i, c in enumerate(cols)}
    linhas[0][idx[Q.ALUNOS["A5"]["titulo"]]] = "Referências, Formatação (margens, fonte, espaçamento), Citações"
    linhas[1][idx[Q.ALUNOS["A9"]["titulo"]]] = ("Estilo de orientação (frequência de reuniões, nível de cobrança), "
                                                "Vagas disponíveis, Outro")
    linhas[2][idx[Q.ALUNOS["A9"]["titulo"]]] = "Áreas de pesquisa, se ele responde e-mail"
    return cols, linhas


def gerar_professores(n=8, seed=7):
    rng = random.Random(seed)
    cols = cabecalho(Q.PROFESSORES)
    linhas = []
    for i in range(n):
        if i == 3:  # um professor que nunca orientou: o Forms envia direto, o resto fica vazio
            row = [f"21/10/2026 09:{i:02d}:00", Q.CONSENTIU, Q.NUNCA_ORIENTOU] + [""] * (len(cols) - 3)
            linhas.append(row)
            continue
        row = [f"21/10/2026 09:{i:02d}:00", Q.CONSENTIU]
        for cod, q in Q.PROFESSORES.items():
            if cod == "P1":
                row.append(rng.choice(["Sim, atualmente", "Já orientei, mas não no momento"]))
            elif q["tipo"] == "grade":
                row += linha_grade(rng, q, {"Corrigir normas ABNT": 4.0, "Revisar conteúdo e argumentação": 3.8})
            else:
                row.append(resposta(rng, q))
        linhas.append(row)
    return cols, linhas


def gravar(caminho, cols, linhas):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with open(caminho, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(cols)
        w.writerows(linhas)


if __name__ == "__main__":
    gravar(ARQ_ALUNOS, *gerar_alunos())
    gravar(ARQ_PROFESSORES, *gerar_professores())
    print(f"Gravados (FICTÍCIOS): {ARQ_ALUNOS.name}, {ARQ_PROFESSORES.name}")
