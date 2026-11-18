import json
import re
import sys
from pathlib import Path

import pandas as pd
import pytest

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))

import analisar as AN  # noqa: E402
import gerar_dados_teste as G  # noqa: E402
import questoes as Q  # noqa: E402

A5 = Q.ALUNOS["A5"]["opcoes"]
A9 = Q.ALUNOS["A9"]["opcoes"]


# --- Caixas de seleção com vírgula dentro das opções -------------------------

def test_caixas_opcao_com_virgula_nao_quebra():
    marc, livre = AN.separar_caixas("Referências, Formatação (margens, fonte, espaçamento), Citações", A5)
    assert marc == ["Referências", "Formatação (margens, fonte, espaçamento)", "Citações"]
    assert livre == []


def test_caixas_so_a_opcao_com_virgula():
    marc, _ = AN.separar_caixas("Estilo de orientação (frequência de reuniões, nível de cobrança)", A9)
    assert marc == ["Estilo de orientação (frequência de reuniões, nível de cobrança)"]


def test_caixas_texto_livre_vira_outro():
    marc, livre = AN.separar_caixas("Áreas de pesquisa, se ele responde e-mail, com vírgula", A9)
    assert marc == ["Áreas de pesquisa"]
    assert livre == ["se ele responde e-mail, com vírgula"]


def test_caixas_opcao_outro_literal():
    marc, livre = AN.separar_caixas("Vagas disponíveis, Outro", A9)
    assert marc == ["Vagas disponíveis", "Outro"] and livre == []


def test_caixas_vazia():
    assert AN.separar_caixas("", A5) == ([], [])


# --- Filtros -----------------------------------------------------------------

def test_filtro_consentimento():
    df = pd.DataFrame({Q.CONSENTIMENTO: [Q.CONSENTIU, Q.NAO_CONSENTIU, Q.CONSENTIU]})
    ok, removidos = AN.filtrar_consentimento(df)
    assert len(ok) == 2 and removidos == 1


def test_filtro_nunca_orientou():
    df = pd.DataFrame({Q.PROFESSORES["P1"]["titulo"]: ["Sim, atualmente", Q.NUNCA_ORIENTOU]})
    ok, removidos = AN.filtrar_nunca_orientou(df)
    assert len(ok) == 1 and removidos == 1


# --- Top-2 e notas -----------------------------------------------------------

def test_top2():
    s = pd.Series(["Concordo", "Concordo totalmente", "Neutro", "Discordo", ""])
    r = AN.resumo_concordancia(s)
    assert r["n"] == 4 and r["top2"] == pytest.approx(0.5)


def test_nota_da_grade():
    assert AN.nota("5 - Muito difícil") == 5 and AN.nota("3") == 3 and AN.nota("") is None


# --- Vereditos com casos montados à mão --------------------------------------

def conc(top2_frac, n=10):
    k = round(top2_frac * n)
    return AN.resumo_concordancia(pd.Series(["Concordo"] * k + ["Discordo"] * (n - k)))


def base_alunos(**over):
    linhas = {l: {"n": 10, "media": 2.0, "pct_4_5": 0.1, "distribuicao": {}} for l in Q.DIFICULDADES_ALUNO}
    A = {
        "A3": {"linhas": linhas, "faltando": []},
        "A4": AN.resumo_multipla(pd.Series(["Cumprir prazos"] * 10), Q.DIFICULDADES_ALUNO),
        "A5": AN.resumo_caixas(pd.Series(["Referências, Citações"] * 10), A5),
        "A6": AN.resumo_numerico(pd.Series(["2"] * 10)),
        "A8": conc(0.3), "A9": AN.resumo_caixas(pd.Series(["Vagas disponíveis"] * 10), A9),
        "A11": conc(0.8), "A12": conc(0.7), "A13": conc(0.6),
        "A14": AN.resumo_caixas(pd.Series(["Nome"] * 10), Q.ALUNOS["A14"]["opcoes"]),
    }
    A.update(over)
    return A


def base_prof(**over):
    P = {"P7": conc(0.6), "P9": conc(0.6), "P10": conc(0.5), "P12": conc(0.8),
         "P8": AN.resumo_caixas(pd.Series(["Informações erradas"] * 10), Q.PROFESSORES["P8"]["opcoes"])}
    P.update(over)
    return P


def veredito(hs, hid):
    return next(h for h in hs if h["id"] == hid)


def test_h1_confirma_por_ranking():
    A = base_alunos()
    A["A3"]["linhas"]["Aplicar as normas ABNT"]["media"] = 4.5
    h = veredito(AN.avaliar_hipoteses(A, None), "H1")
    assert h["veredito"] == AN.CONFIRMADA and "Referências" in h["decisao"]


def test_h1_confirma_por_a4_no_limite_25():
    A = base_alunos(A4=AN.resumo_multipla(pd.Series(["Aplicar as normas ABNT"] * 1 + ["Cumprir prazos"] * 3),
                                          Q.DIFICULDADES_ALUNO))
    for i, l in enumerate(Q.DIFICULDADES_ALUNO):  # ABNT fica em último na A3
        A["A3"]["linhas"][l]["media"] = 1.0 if l == Q.LINHA_ABNT else 3.0 + i / 10
    assert veredito(AN.avaliar_hipoteses(A, None), "H1")["veredito"] == AN.CONFIRMADA


def test_h1_nao_confirma_e_indica_maior_dor():
    A = base_alunos()
    for i, l in enumerate(Q.DIFICULDADES_ALUNO):
        A["A3"]["linhas"][l]["media"] = 1.0 if l == Q.LINHA_ABNT else 3.0 + i / 10
    h = veredito(AN.avaliar_hipoteses(A, None), "H1")
    assert h["veredito"] == AN.NAO_CONFIRMADA and "Conseguir tempo com o orientador" in h["decisao"]


def test_h2_precisa_das_duas_condicoes():
    assert veredito(AN.avaliar_hipoteses(base_alunos(), None), "H2")["veredito"] == AN.CONFIRMADA
    A = base_alunos(A6=AN.resumo_numerico(pd.Series(["3"] * 10)))  # média 3 não é < 3
    assert veredito(AN.avaliar_hipoteses(A, None), "H2")["veredito"] == AN.NAO_CONFIRMADA


def test_h3_limite_50_nao_confirma():
    assert veredito(AN.avaliar_hipoteses(base_alunos(A8=conc(0.5)), None), "H3")["veredito"] == AN.NAO_CONFIRMADA
    assert veredito(AN.avaliar_hipoteses(base_alunos(A8=conc(0.4)), None), "H3")["veredito"] == AN.CONFIRMADA


def test_h4_sem_professores_e_insuficiente():
    assert veredito(AN.avaliar_hipoteses(base_alunos(), None), "H4")["veredito"] == AN.INSUFICIENTE


def test_h4_limite_60_confirma():
    assert veredito(AN.avaliar_hipoteses(base_alunos(), base_prof()), "H4")["veredito"] == AN.CONFIRMADA
    P = base_prof(P7=conc(0.5))
    assert veredito(AN.avaliar_hipoteses(base_alunos(), P), "H4")["veredito"] == AN.NAO_CONFIRMADA


def test_h5_feedback_depende_da_p10():
    h = veredito(AN.avaliar_hipoteses(None, base_prof()), "H5")
    assert h["veredito"] == AN.CONFIRMADA and "NÃO entra" in h["decisao"]
    h = veredito(AN.avaliar_hipoteses(None, base_prof(P10=conc(0.7))), "H5")
    assert "ENTRA" in h["decisao"] and "NÃO" not in h["decisao"]
    h = veredito(AN.avaliar_hipoteses(None, base_prof(P9=conc(0.4))), "H5")
    assert h["veredito"] == AN.NAO_CONFIRMADA


def test_h6():
    assert veredito(AN.avaliar_hipoteses(base_alunos(), base_prof()), "H6")["veredito"] == AN.CONFIRMADA
    P = base_prof(P12=conc(0.4))
    assert veredito(AN.avaliar_hipoteses(base_alunos(), P), "H6")["veredito"] == AN.NAO_CONFIRMADA


# --- Ponta a ponta com os dados fictícios ------------------------------------

def test_ponta_a_ponta(tmp_path):
    ca, la = G.gerar_alunos()
    cp, lp = G.gerar_professores()
    G.gravar(tmp_path / "a.csv", ca, la)
    G.gravar(tmp_path / "p.csv", cp, lp)
    resumo = AN.executar(tmp_path / "a.csv", tmp_path / "p.csv", tmp_path / "out")
    assert resumo["meta"]["alunos"]["validas"] == 39 and resumo["meta"]["alunos"]["sem_consentimento"] == 1
    assert resumo["meta"]["professores"]["validas"] == 7 and resumo["meta"]["professores"]["nunca_orientou"] == 1
    a5 = resumo["alunos"]["A5"]["contagem"]
    assert a5["Formatação (margens, fonte, espaçamento)"] >= 1
    assert "se ele responde e-mail" in resumo["alunos"]["A9"]["texto_livre"]
    assert [h["id"] for h in resumo["hipoteses"]] == ["H1", "H2", "H3", "H4", "H5", "H6"]
    rel = (tmp_path / "out" / "relatorio.md").read_text(encoding="utf-8")
    assert "**Atenção:**" not in rel  # 39 alunos e 7 professores: acima dos mínimos, sem aviso
    assert (tmp_path / "out" / "graficos" / "A3.png").exists()
    json.loads((tmp_path / "out" / "resumo.json").read_text(encoding="utf-8"))


def test_aviso_de_amostra_pequena(tmp_path):
    ca, la = G.gerar_alunos()
    G.gravar(tmp_path / "a.csv", ca, la[:10])
    AN.executar(tmp_path / "a.csv", None, tmp_path / "out")
    rel = (tmp_path / "out" / "relatorio.md").read_text(encoding="utf-8")
    assert "**Atenção:** menos de 30 alunos" in rel


def test_aceita_so_um_arquivo(tmp_path):
    cp, lp = G.gerar_professores()
    G.gravar(tmp_path / "p.csv", cp, lp)
    resumo = AN.executar(None, tmp_path / "p.csv", tmp_path / "out")
    assert veredito(resumo["hipoteses"], "H1")["veredito"] == AN.INSUFICIENTE


def test_titulos_batem_com_o_script_do_forms():
    gs = RAIZ.parent / "scripts" / "criar-formularios.gs"
    if not gs.exists():
        pytest.skip("criar-formularios.gs não encontrado")
    texto = gs.read_text(encoding="utf-8")
    for defs in (Q.ALUNOS, Q.PROFESSORES):
        for q in defs.values():
            if q.get("so_publicado"):
                continue  # pergunta que só existe no formulário publicado, não no script
            assert q["titulo"].replace('"', "") in texto.replace('"', ""), q["titulo"]


# --- Formulário publicado em 19/10/2026 (diferente do kit) -------------------
# Cabeçalhos copiados da planilha real (com os espaços e quebras sobrando); respostas INVENTADAS.

PUBLICADO = RAIZ / "fixtures" / "FICTICIO_respostas_alunos_publicado.csv"


def test_publicado_descarta_coluna_de_nomes_antes_de_tudo(tmp_path):
    resumo = AN.executar(PUBLICADO, None, tmp_path / "out")
    rel = (tmp_path / "out" / "relatorio.md").read_text(encoding="utf-8")
    js = (tmp_path / "out" / "resumo.json").read_text(encoding="utf-8")
    priv = resumo["meta"]["alunos"]["removidas_por_privacidade"]
    assert priv == [{"coluna": "Quais são os nomes das pessoas que participarão?", "preenchidas": 1}]
    for saida in (rel, js):
        assert "Fulana Exemplo" not in saida  # o nome fictício da fixture nunca sai
    assert "foi descartada na leitura (1 célula(s) preenchida(s))" in rel


def test_publicado_tarja_email_e_telefone_nas_abertas(tmp_path):
    resumo = AN.executar(PUBLICADO, None, tmp_path / "out")
    abertas = " ".join(resumo["alunos"]["A15"]["respostas"] + resumo["alunos"]["A0"]["respostas"])
    assert "fulana@exemplo.edu" not in abertas and "[e-mail removido]" in abertas
    assert "41 99999-0000" not in abertas and "[telefone removido]" in abertas


def test_publicado_consentimento_em_duas_perguntas(tmp_path):
    resumo = AN.executar(PUBLICADO, None, tmp_path / "out")
    m = resumo["meta"]["alunos"]
    assert (m["total"], m["validas"], m["sem_consentimento"]) == (6, 4, 2)


def test_publicado_escala_numerica_vira_concordancia(tmp_path):
    resumo = AN.executar(PUBLICADO, None, tmp_path / "out")
    a13 = resumo["alunos"]["A13"]
    assert a13["n"] == 4 and a13["contagem"]["Concordo totalmente"] == 3 and a13["contagem"]["Concordo"] == 1
    assert a13["top2"] == 1.0


def test_publicado_acha_perguntas_sem_codigo_e_com_espacos(tmp_path):
    resumo = AN.executar(PUBLICADO, None, tmp_path / "out")
    A = resumo["alunos"]
    assert A["A1"]["n"] == 4 and A["A6"]["media"] == 4.0
    assert A["A4"]["contagem"]["Escolher o tema"] == 2  # a "A3" publicada é, na prática, a A4
    assert A["A4G"]["contagem"]["Moderado"] == 3
    assert A["A3"] is None and resumo["meta"]["alunos"]["faltando"] == ["A3"]


def test_publicado_opcao_juntada_nao_vira_texto_livre(tmp_path):
    resumo = AN.executar(PUBLICADO, None, tmp_path / "out")
    a5 = resumo["alunos"]["A5"]
    assert a5["contagem"]["Resumo e palavras-chave · Figuras e tabelas"] == 1 and a5["texto_livre"] == []


def test_publicado_h1_usa_so_a_a4_e_avisa(tmp_path):
    resumo = AN.executar(PUBLICADO, None, tmp_path / "out")
    h1 = veredito(resumo["hipoteses"], "H1")
    assert h1["veredito"] == AN.CONFIRMADA  # 1 de 4 = 25% escolheu ABNT
    assert "A3 não existe" in h1["evidencia"]


def test_titulo_normalizado():
    assert AN.normalizar("\n\nQual a área do seu curso? ") == AN.normalizar("A2. Qual a área do seu curso?")
    assert AN.normalizar("Conforme a pergunta anterior, qual é ... tarefas ?").endswith("tarefas?")


def test_grafia_sem_acento_conta_como_a_mesma_opcao():
    r = AN.resumo_caixas(pd.Series(["Referencias, Citações", "Referências"]), Q.ALUNOS["A5"]["opcoes"])
    assert r["contagem"]["Referências"] == 2 and r["texto_livre"] == []
