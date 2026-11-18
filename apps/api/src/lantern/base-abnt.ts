import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface RegraAbnt {
  id: string;
  tipo_documento: string;
  titulo: string;
  explicacao: string;
  exemplo_errado: string;
  exemplo_certo: string;
  fonte?: string;
}

/**
 * Caminho padrão da base: data/abnt/nbr6023-regras.json na raiz do repositório.
 * De apps/api/src/lantern (ou apps/api/dist/lantern) são 4 níveis até a raiz — igual no Docker (/app).
 */
export const CAMINHO_PADRAO_BASE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../data/abnt/nbr6023-regras.json');

export function carregarBaseAbnt(caminho = CAMINHO_PADRAO_BASE): RegraAbnt[] {
  if (!existsSync(caminho)) return [];
  const dados = JSON.parse(readFileSync(caminho, 'utf8')) as RegraAbnt[];
  return Array.isArray(dados) ? dados : [];
}

/** Base em texto compacto para o prompt do Archivist (RAG): só o que o modelo precisa para aplicar a regra. */
export function baseParaPrompt(regras: RegraAbnt[]): string {
  return regras
    .map((r) => `[${r.id}] (${r.tipo_documento}) ${r.titulo}\n  Regra: ${r.explicacao}\n  Errado: ${r.exemplo_errado}\n  Certo: ${r.exemplo_certo}`)
    .join('\n');
}
