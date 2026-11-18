/**
 * Montagem de referências no formato da NBR 6023:2018 a partir de dados de APIs públicas
 * (Crossref para DOI, BrasilAPI para ISBN). Tudo determinístico: aqui não tem IA.
 *
 * O destaque (negrito) sai marcado com **asteriscos**, o mesmo formato que a Lantern usa; o front
 * transforma em <strong>. As regras citadas (REF-...) são as da base em data/abnt/nbr6023-regras.json.
 *
 * Bases públicas têm lacunas e erros. Por isso cada função devolve também `avisos`: o que o aluno
 * precisa conferir antes de usar a referência.
 */

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'del', 'della', 'di', 'van', 'von', 'der', 'den', 'la', 'le']);
const PARENTESCO = new Set(['junior', 'júnior', 'jr', 'jr.', 'filho', 'neto', 'sobrinho']);

export interface ReferenciaMontada {
  referencia: string;
  tipo: 'artigo' | 'livro' | 'capitulo' | 'outro';
  avisos: string[];
}

/** "14 nov. 2026" (REF-DATA-02: meses abreviados; maio não abrevia). */
export function dataAbnt(d: Date): string {
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Tira marcação (HTML/MathML que a Crossref às vezes manda), asteriscos e espaços sobrando. */
export function limpar(texto: unknown): string {
  return String(texto ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const semPontoFinal = (t: string) => t.replace(/[.\s]+$/, '');

/** "MARIA DA SILVA" → "Maria da Silva" (partículas em minúsculas). */
export function capitalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && PARTICULAS.has(p) ? p : p.replace(/(^|[-'’])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase())))
    .join(' ');
}

/** Prenome + sobrenome → "SOBRENOME, Prenome" (REF-AUTOR-01). */
export function nomeAbnt(prenome: string, sobrenome: string): string {
  const s = limpar(sobrenome).toUpperCase();
  const p = limpar(prenome);
  return p ? `${s}, ${p}` : s;
}

/**
 * Nome completo numa string só ("KATSUHIRO OTOMO", "João da Silva Júnior") → forma ABNT.
 * Regra prática: o último sobrenome entra; "Júnior/Filho/Neto" acompanham o sobrenome anterior;
 * partículas (de, da, dos) ficam depois do prenome.
 */
export function nomeCompletoAbnt(nome: string): string {
  const partes = limpar(nome).split(' ').filter(Boolean);
  if (partes.length < 2) return limpar(nome).toUpperCase();
  let corte = partes.length - 1;
  if (PARENTESCO.has(partes[corte]!.toLowerCase()) && corte >= 2) corte -= 1;
  const sobrenome = partes.slice(corte).join(' ');
  const prenome = capitalizarNome(partes.slice(0, corte).join(' '));
  return nomeAbnt(prenome, sobrenome);
}

/** Até 3 autores: todos, separados por "; " (REF-AUTOR-02). 4 ou mais: o primeiro + et al. (REF-AUTOR-03). */
export function autoresAbnt(autores: string[]): string {
  if (autores.length === 0) return '';
  return autores.length >= 4 ? `${autores[0]} et al.` : autores.join('; ');
}

const tituloComSubtitulo = (titulo: string, subtitulo: string, destaque: boolean) => {
  const t = semPontoFinal(titulo);
  const s = semPontoFinal(subtitulo);
  const principal = destaque ? `**${t}**` : t;
  // REF-TITULO-02: subtítulo sem destaque, depois de dois-pontos
  return s ? `${principal}: ${s.charAt(0).toLowerCase()}${s.slice(1)}` : principal;
};

// ---------------------------------------------------------------------------
// Crossref (DOI)
// ---------------------------------------------------------------------------

export interface ObraCrossref {
  DOI?: string;
  type?: string;
  title?: string[];
  subtitle?: string[];
  author?: { given?: string; family?: string; name?: string }[];
  'container-title'?: string[];
  volume?: string;
  issue?: string;
  page?: string;
  publisher?: string;
  'publisher-location'?: string;
  published?: { 'date-parts'?: number[][] };
  issued?: { 'date-parts'?: number[][] };
}

export function deCrossref(obra: ObraCrossref, hoje: Date): ReferenciaMontada {
  const avisos: string[] = [];
  const doi = limpar(obra.DOI);
  const titulo = limpar(obra.title?.[0]);
  const subtitulo = limpar(obra.subtitle?.[0]);
  const revista = limpar(obra['container-title']?.[0]);
  const editora = limpar(obra.publisher);
  const [ano, mes] = obra.published?.['date-parts']?.[0] ?? obra.issued?.['date-parts']?.[0] ?? [];

  const nomes = (obra.author ?? [])
    .map((a) => (a.family ? nomeAbnt(a.given ?? '', a.family) : limpar(a.name).toUpperCase()))
    .filter(Boolean);
  const autores = autoresAbnt(nomes);
  if (nomes.length === 0) avisos.push('A base não informa autor. Se a obra tiver autor, acrescente no começo.');
  if (nomes.length >= 4) avisos.push(`São ${nomes.length} autores: usei o primeiro seguido de "et al.". A norma também aceita listar todos.`);
  if (!ano) avisos.push('A base não informa o ano. Confira na publicação.');

  // REF-PUB-03: sem local → [S. l.]. A Crossref quase nunca traz a cidade.
  const local = limpar(obra['publisher-location']).split(',')[0] || '[S. l.]';
  if (local === '[S. l.]') avisos.push('A base não informa a cidade de publicação: usei [S. l.]. Se você souber a cidade, troque.');

  const online = `DOI: ${doi}. Disponível em: https://doi.org/${doi}. Acesso em: ${dataAbnt(hoje)}.`;
  const data = [mes ? MESES[mes - 1] : '', ano ?? '[s. d.]'].filter(Boolean).join(' ');
  const cabeca = autores ? `${autores}. ` : '';
  const paginas = obra.page ? `p. ${limpar(obra.page)}` : '';
  const tipo = obra.type ?? '';

  if (tipo === 'journal-article' && revista) {
    // REF-ART-01 e REF-ART-02: destaque no periódico; local, v., n., p., mês e ano separados por vírgula
    const partes = [`**${revista}**`, local, obra.volume ? `v. ${limpar(obra.volume)}` : '', obra.issue ? `n. ${limpar(obra.issue)}` : '', paginas, data].filter(Boolean);
    return { tipo: 'artigo', avisos, referencia: `${cabeca}${tituloComSubtitulo(titulo, subtitulo, false)}. ${partes.join(', ')}. ${online}` };
  }

  if ((tipo === 'book-chapter' || tipo === 'proceedings-article') && revista) {
    // REF-CAP-01: parte de uma obra maior, com "In:" e destaque na obra
    avisos.push(
      tipo === 'proceedings-article'
        ? 'É um trabalho publicado em evento. A norma pede nome, número, ano e local do evento antes de "Anais": confira com o orientador.'
        : 'É um capítulo. A base não traz o organizador do livro: acrescente depois de "In:" se houver.',
    );
    const publicacao = `${local}: ${editora || '[s. n.]'}, ${ano ?? '[s. d.]'}`;
    return {
      tipo: 'capitulo',
      avisos,
      referencia: `${cabeca}${tituloComSubtitulo(titulo, subtitulo, false)}. In: **${semPontoFinal(revista)}**. ${publicacao}.${paginas ? ` ${paginas}.` : ''} ${online}`,
    };
  }

  // Livro e demais tipos: destaque no título (REF-TITULO-01), Local: Editora, ano (REF-PUB-01)
  if (tipo !== 'book' && tipo !== 'monograph') avisos.push('Tipo de documento pouco comum: montei no formato geral. Confira com o orientador.');
  const publicacao = `${local}: ${editora || '[s. n.]'}, ${ano ?? '[s. d.]'}`;
  return {
    tipo: tipo === 'book' || tipo === 'monograph' ? 'livro' : 'outro',
    avisos,
    referencia: `${cabeca}${tituloComSubtitulo(titulo, subtitulo, true)}. ${publicacao}. ${online}`,
  };
}

// ---------------------------------------------------------------------------
// BrasilAPI (ISBN)
// ---------------------------------------------------------------------------

export interface LivroBrasilApi {
  isbn?: string;
  title?: string;
  subtitle?: string | null;
  authors?: string[];
  publisher?: string | null;
  year?: number | null;
  location?: string | null;
}

const ehCaixaAlta = (t: string) => t.length > 3 && t === t.toUpperCase() && /\p{L}/u.test(t);
const fraseComInicialMaiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();

/** REF-PUB-02: editora sem natureza jurídica ("Ltda.", "S.A.", "EIRELI"...). */
export function limparEditora(editora: string): string {
  return limpar(editora)
    .replace(/\s*[-,]?\s*\b(ltda\.?|s\.?\s?\/?a\.?|eireli|epp|me|cia\.?|& cia\.?|inc\.?|llc)\s*$/i, '')
    .trim();
}

export function deBrasilApi(livro: LivroBrasilApi): ReferenciaMontada {
  const avisos: string[] = [];
  let titulo = limpar(livro.title);
  let subtitulo = limpar(livro.subtitle);
  if (ehCaixaAlta(titulo)) {
    titulo = fraseComInicialMaiuscula(titulo);
    subtitulo = subtitulo.toLowerCase();
    avisos.push('O título veio todo em maiúsculas na base: deixei só a inicial maiúscula. Corrija nomes próprios, se houver.');
  }

  const nomes = (livro.authors ?? []).map(nomeCompletoAbnt).filter(Boolean);
  if (nomes.length === 0) avisos.push('A base não informa autor. Se o livro tiver autor, acrescente no começo.');
  if (nomes.length > 1) avisos.push('A base às vezes lista tradutores e ilustradores como autores. Deixe só quem é autor de fato.');
  if (nomes.some((n) => n.split(',')[0]!.trim().includes(' '))) avisos.push('Há sobrenome composto: confira se a entrada pelo sobrenome está certa.');
  if (nomes.length >= 4) avisos.push(`São ${nomes.length} nomes: usei o primeiro seguido de "et al.".`);

  const cidade = limpar(livro.location).split(/[,/-]/)[0]!.trim();
  const local = cidade ? capitalizarNome(cidade) : '[S. l.]';
  const editora = limparEditora(livro.publisher ?? '') || '[s. n.]';
  const ano = livro.year ? String(livro.year) : '[s. d.]';
  if (local === '[S. l.]') avisos.push('A base não informa a cidade: usei [S. l.].');
  if (editora === '[s. n.]') avisos.push('A base não informa a editora: usei [s. n.].');
  if (ano === '[s. d.]') avisos.push('A base não informa o ano. Confira no livro.');
  avisos.push('A base não informa a edição. Se não for a 1ª, acrescente depois do título (ex.: 2. ed.).');

  const autores = autoresAbnt(nomes);
  return {
    tipo: 'livro',
    avisos,
    referencia: `${autores ? `${autores}. ` : ''}${tituloComSubtitulo(titulo, subtitulo, true)}. ${local}: ${editora}, ${ano}.`,
  };
}

// ---------------------------------------------------------------------------
// Validação do que o aluno digita
// ---------------------------------------------------------------------------

/** Aceita "10.1234/abc", "doi:10.1234/abc" e "https://doi.org/10.1234/abc". Devolve só o DOI, ou null. */
export function normalizarDoi(entrada: string): string | null {
  const doi = entrada
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');
  return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9<>]{1,180}$/.test(doi) ? doi : null;
}

/** Aceita ISBN-10 e ISBN-13 com ou sem hífens e confere o dígito verificador. Devolve só os dígitos, ou null. */
export function normalizarIsbn(entrada: string): string | null {
  const isbn = entrada.replace(/[\s-]/g, '').toUpperCase();
  if (/^\d{13}$/.test(isbn)) {
    const soma = [...isbn].reduce((t, d, i) => t + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
    return soma % 10 === 0 ? isbn : null;
  }
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const soma = [...isbn].reduce((t, d, i) => t + (d === 'X' ? 10 : Number(d)) * (10 - i), 0);
    return soma % 11 === 0 ? isbn : null;
  }
  return null;
}
