"""Valida a base ABNT da Lantern (regras + casos de teste).

Uso: python3 -I validar_base.py
Só usa a biblioteca padrão. Sai com código 1 se houver erro.
"""
import json
import sys
from pathlib import Path

PASTA = Path(__file__).resolve().parent
CAMPOS_REGRA = ["id", "tipo_documento", "titulo", "explicacao", "exemplo_errado", "exemplo_certo", "fonte"]
CAMPOS_CASO = ["id", "tipo_documento", "entrada", "saida_esperada", "regras_violadas", "observacao"]


def carregar(nome):
    with open(PASTA / nome, encoding="utf-8") as f:
        return json.load(f)


def checar_campos(itens, campos, rotulo, erros):
    for i, item in enumerate(itens):
        for campo in campos:
            if campo not in item:
                erros.append(f"{rotulo} #{i} ({item.get('id', '?')}): falta o campo '{campo}'")
            elif campo != "regras_violadas" and not str(item[campo]).strip():
                erros.append(f"{rotulo} {item.get('id', '?')}: campo '{campo}' vazio")


def checar_ids_unicos(itens, rotulo, erros):
    vistos = set()
    for item in itens:
        i = item.get("id")
        if i in vistos:
            erros.append(f"{rotulo}: id repetido {i}")
        vistos.add(i)
    return vistos


def main():
    erros = []
    regras = carregar("nbr6023-regras.json")
    casos = carregar("casos-de-teste.json")

    checar_campos(regras, CAMPOS_REGRA, "Regra", erros)
    checar_campos(casos, CAMPOS_CASO, "Caso", erros)
    ids_regras = checar_ids_unicos(regras, "Regras", erros)
    checar_ids_unicos(casos, "Casos", erros)

    for r in regras:
        if r.get("exemplo_errado") == r.get("exemplo_certo"):
            erros.append(f"Regra {r['id']}: exemplo errado e certo são iguais")

    for c in casos:
        violadas = c.get("regras_violadas", [])
        if not isinstance(violadas, list):
            erros.append(f"Caso {c['id']}: regras_violadas deve ser lista")
            continue
        for rid in violadas:
            if rid not in ids_regras:
                erros.append(f"Caso {c['id']}: regra inexistente {rid}")
        if not violadas and c.get("entrada") != c.get("saida_esperada"):
            erros.append(f"Caso {c['id']}: sem regras violadas, mas entrada difere da saída esperada")
        if violadas and c.get("entrada") == c.get("saida_esperada"):
            erros.append(f"Caso {c['id']}: tem regras violadas, mas entrada é igual à saída esperada")

    usadas = {rid for c in casos for rid in c.get("regras_violadas", [])}
    sem_caso = sorted(ids_regras - usadas)
    corretos = sum(1 for c in casos if not c.get("regras_violadas"))

    print(f"Regras: {len(regras)} | Casos: {len(casos)} ({corretos} já corretos, {len(casos) - corretos} com erros)")
    if sem_caso:
        print("Aviso: regras sem nenhum caso de teste: " + ", ".join(sem_caso))
    if erros:
        print("ERROS:")
        for e in erros:
            print(" - " + e)
        sys.exit(1)
    print("OK: base válida.")


if __name__ == "__main__":
    main()
