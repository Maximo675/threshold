import { createHmac } from 'node:crypto';

/**
 * Pseudonimização — a última camada antes de qualquer texto sair do servidor para o provedor de IA.
 *
 * O que faz com o texto:
 * 1. Pessoas conhecidas (o aluno, o orientador...) viram códigos estáveis, como ALUNO_7F3A2C.
 *    Reconhece maiúsculas/minúsculas, acentos e a forma invertida da ABNT ("SOUZA, Ana").
 *    Autores citados nas referências NÃO são trocados: são obras publicadas, e a Lantern precisa vê-los.
 * 2. Qualquer e-mail vira EMAIL_xxxxxx.
 * 3. CPF e telefone são REMOVIDOS (não há motivo para a IA ver, nem para guardar o original).
 *
 * O mapa código → valor original fica só no servidor, para devolver os nomes na resposta ao aluno.
 * Ele nunca é enviado à IA, nunca é gravado em log e é descartado ao fim da requisição.
 *
 * Referência: OWASP Top 10 for LLM 2025, LLM02 (Sensitive Information Disclosure).
 */

export type TipoPessoa = 'ALUNO' | 'PROFESSOR' | 'PESSOA';

export interface Identidade {
  tipo: TipoPessoa;
  nome?: string;
}

export interface ResultadoPseudonimizacao {
  /** Texto seguro para enviar à IA. */
  texto: string;
  /** código → valor original. Fica no servidor. */
  mapa: Map<string, string>;
  /** Quantos trechos foram trocados ou removidos (útil para auditoria, sem expor o conteúdo). */
  substituicoes: number;
}

const VARIANTES: Record<string, string> = {
  a: 'aàáâãä', e: 'eèéêë', i: 'iìíîï', o: 'oòóôõö', u: 'uùúûü', c: 'cç', n: 'nñ',
};

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
const CPF = /(?<![\p{N}])\d{3}\.?\d{3}\.?\d{3}-?\d{2}(?![\p{N}])/gu;
// Telefones brasileiros: (41) 99999-9999, 41 3333-3333, +55 41 999999999...
const TELEFONE = /(?<![\p{N}])(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}(?![\p{N}])/gu;

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** "Ana" → padrão que aceita "ana", "ÁNA", "Âna"... */
function padraoSemAcento(palavra: string): string {
  return [...palavra.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()]
    .map((ch) => (VARIANTES[ch] ? `[${VARIANTES[ch]}]` : escaparRegex(ch)))
    .join('');
}

/** Padrões para um nome completo: "Ana Souza" e a forma da ABNT "SOUZA, Ana". */
function padroesDoNome(nome: string): RegExp[] {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return [];
  const limite = (p: string) => `(?<![\\p{L}\\p{N}])${p}(?![\\p{L}\\p{N}])`;
  const direto = partes.map(padraoSemAcento).join('\\s+');
  const padroes = [new RegExp(limite(direto), 'giu')];
  if (partes.length >= 2) {
    const sobrenome = padraoSemAcento(partes[partes.length - 1]!);
    const prenomes = partes.slice(0, -1).map(padraoSemAcento).join('\\s+');
    padroes.push(new RegExp(limite(`${sobrenome},\\s*${prenomes}`), 'giu'));
  }
  return padroes;
}

export function criarPseudonimizador(segredo: string) {
  if (segredo.length < 32) {
    throw new Error('O segredo da pseudonimização precisa ter pelo menos 32 caracteres.');
  }

  const codigo = (prefixo: string, valor: string) => {
    const normalizado = valor.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
    const hash = createHmac('sha256', segredo).update(normalizado).digest('hex').slice(0, 6).toUpperCase();
    return `${prefixo}_${hash}`;
  };

  function pseudonimizar(texto: string, identidades: Identidade[] = []): ResultadoPseudonimizacao {
    const mapa = new Map<string, string>();
    let substituicoes = 0;
    let saida = texto;

    const trocar = (re: RegExp, gerar: (achado: string) => string) => {
      saida = saida.replace(re, (achado) => {
        substituicoes++;
        return gerar(achado);
      });
    };

    // 1. Pessoas conhecidas pelo nome. A forma da ABNT ganha um código próprio (sufixo _ABNT)
    //    para voltar exatamente como estava.
    for (const pessoa of identidades) {
      const nome = pessoa.nome?.trim();
      if (!nome) continue;
      const cod = codigo(pessoa.tipo, nome);
      const [direto, invertido] = padroesDoNome(nome);
      if (invertido) {
        trocar(invertido, (achado) => {
          mapa.set(`${cod}_ABNT`, achado);
          return `${cod}_ABNT`;
        });
      }
      if (direto) {
        trocar(direto, () => {
          mapa.set(cod, nome);
          return cod;
        });
      }
    }

    // 2. Qualquer e-mail (de pessoa conhecida ou não)
    trocar(EMAIL, (achado) => {
      const cod = codigo('EMAIL', achado);
      mapa.set(cod, achado);
      return cod;
    });

    // 3. Dados que não têm por que existir aqui: removidos, sem volta
    trocar(CPF, () => '[CPF REMOVIDO]');
    trocar(TELEFONE, () => '[TELEFONE REMOVIDO]');

    return { texto: saida, mapa, substituicoes };
  }

  /** Devolve os valores originais na resposta da IA, usando o mapa que ficou no servidor. */
  function restaurar(texto: string, mapa: Map<string, string>): string {
    let saida = texto;
    // Códigos mais longos primeiro: ALUNO_7F3A2C_ABNT antes de ALUNO_7F3A2C
    const pares = [...mapa].sort(([a], [b]) => b.length - a.length);
    for (const [cod, original] of pares) saida = saida.split(cod).join(original);
    return saida;
  }

  return { pseudonimizar, restaurar };
}
