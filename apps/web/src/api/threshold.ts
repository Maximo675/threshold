/**
 * Cliente da API do Threshold (dossiê, orientadores, painel, referências e fortaleza).
 * Tudo passa pelo nosso servidor (mesma origem): o navegador nunca fala direto com IA nem com bases públicas.
 */

export class ErroApi extends Error {
  readonly status: number;
  readonly codigo?: string;

  constructor(message: string, status: number, codigo?: string) {
    super(message);
    this.name = 'ErroApi';
    this.status = status;
    this.codigo = codigo;
  }
}

async function pedir<T>(metodo: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, corpo?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: metodo,
      headers: corpo === undefined ? undefined : { 'content-type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi('Sem conexão com o servidor. Confira se a plataforma está rodando.', 0);
  }
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErroApi(dados.erro ?? 'Algo deu errado. Tente de novo.', res.status, dados.codigo);
  return dados as T;
}

export const mensagemDeErro = (erro: unknown) => (erro instanceof ErroApi ? erro.message : 'Algo deu errado. Tente de novo.');

// ---------- Dossiê ----------

export type EstadoEtapa = 'aprovado' | 'atual' | 'em-revisao' | 'classificado';

export interface ItemChecklist {
  id: string;
  texto: string;
  feito: boolean;
  automatico?: boolean;
}

export interface EtapaDossie {
  numero: number;
  titulo: string;
  estado: EstadoEtapa;
  descricao: string;
  checklist: ItemChecklist[];
}

export interface PrazoDossie {
  id: string;
  titulo: string;
  data: string;
  etapa: number;
  concluido: boolean;
}

export interface Devolutiva {
  id: number;
  etapa: number;
  autor: string;
  tipo: 'devolutiva' | 'lembrete' | 'sistema';
  texto: string;
  quando: string;
}

export interface Dossie {
  aluna: { nome: string; detalhe: string };
  protocolo: string;
  tema: string;
  entregaOficial: string;
  etapas: EtapaDossie[];
  prazos: PrazoDossie[];
  orientador: { id: string; nome: string } | null;
  pedido: { id: number; orientadorId: string; orientadorNome: string; estado: 'pendente' | 'aceito' | 'recusado'; quando: string } | null;
  devolutivas: Devolutiva[];
  concluido: boolean;
}

export const obterDossie = () => pedir<Dossie>('GET', '/api/dossie');
export const marcarItem = (id: string, feito: boolean) => pedir<Dossie>('PATCH', `/api/dossie/checklist/${encodeURIComponent(id)}`, { feito });
export const pedirOrientacao = (orientadorId: string) => pedir<Dossie>('POST', '/api/dossie/pedido', { orientadorId });
export const cancelarPedido = () => pedir<Dossie>('DELETE', '/api/dossie/pedido');
export const enviarParaRevisao = () => pedir<Dossie>('POST', '/api/dossie/revisao');
export const reiniciarDemo = () => pedir<Dossie>('POST', '/api/demo/reiniciar');

// ---------- Orientadores ----------

export interface Orientador {
  id: string;
  nome: string;
  protocolo: string;
  curso: string;
  areas: string[];
  areaEmDestaque: string;
  afinidade: 'alta' | 'média';
  porQue: string;
  estilo: string[];
  vagas: { abertas: number; total: number };
  destaques: string[];
  bomSaber: string;
}

export const obterOrientadores = () => pedir<{ orientadores: Orientador[] }>('GET', '/api/orientadores').then((r) => r.orientadores);

// ---------- Painel do orientador ----------

export interface Painel {
  orientador: { id: string; nome: string; curso: string; vagas: { abertas: number; total: number } };
  professores: { id: string; nome: string }[];
  pedidos: { id: number; aluna: { nome: string; detalhe: string }; tema: string; quando: string; afinidade: string; areaEmComum: string }[];
  orientandos: {
    id: string;
    nome: string;
    tema: string;
    etapa: number;
    tituloEtapa: string;
    situacao: 'em-dia' | 'atrasado' | 'aguardando-revisao';
    detalhe: string;
    lembreteEm: string | null;
    interativo: boolean;
    checklist: { feitos: number; total: number } | null;
  }[];
  devolutivas: Devolutiva[];
  resumo: { orientandos: number; vagasAbertas: number; aguardandoRevisao: number; atrasados: number; pedidosPendentes: number };
}

const painel = (id: string) => `/api/painel/${encodeURIComponent(id)}`;
export const obterPainel = (id: string) => pedir<Painel>('GET', painel(id));
export const responderPedido = (id: string, pedidoId: number, aceitar: boolean) => pedir<Painel>('POST', `${painel(id)}/pedidos/${pedidoId}`, { aceitar });
export const enviarDevolutiva = (id: string, texto: string) => pedir<Painel>('POST', `${painel(id)}/devolutivas`, { texto });
export const revisarEtapa = (id: string, decisao: 'aprovar' | 'devolver', texto?: string) =>
  pedir<Painel>('POST', `${painel(id)}/revisao`, texto ? { decisao, texto } : { decisao });
export const enviarLembrete = (id: string, orientandoId: string) => pedir<Painel>('POST', `${painel(id)}/lembretes`, { orientandoId });

// ---------- Referências ----------

export interface ReferenciaMontada {
  referencia: string;
  tipo: 'artigo' | 'livro' | 'capitulo' | 'outro';
  avisos: string[];
  fonte: 'Crossref' | 'BrasilAPI';
  identificador: string;
}

export interface ItemRevisado {
  n: number;
  original: string;
  situacao: 'ok' | 'corrigir' | 'sem-resposta';
  problemas: { regra: string | null; titulo: string | null; explicacao: string }[];
  corrigida: string;
}

export interface Revisao {
  itens: ItemRevisado[];
  resumo: { total: number; aprovadas: number; corrigir: number; semResposta: number };
  protecao: { substituicoes: number };
}

export const buscarPorDoi = (doi: string) => pedir<ReferenciaMontada>('GET', `/api/referencias/doi?doi=${encodeURIComponent(doi)}`);
export const buscarPorIsbn = (isbn: string) => pedir<ReferenciaMontada>('GET', `/api/referencias/isbn?isbn=${encodeURIComponent(isbn)}`);
export const revisarReferencias = (referencias: string[]) => pedir<Revisao>('POST', '/api/referencias/revisar', { referencias });

// ---------- Fortaleza ----------

export interface Verificacao {
  id: string;
  camada: string;
  titulo: string;
  comoTestamos: string;
  ok: boolean;
}

export interface RelatorioFortaleza {
  geradoEm: string;
  verificacoes: Verificacao[];
  aprovadas: number;
  contadores: {
    desde: string;
    enviosParaIA: number;
    trechosProtegidos: number;
    etiquetasNeutralizadas: number;
    bloqueiosPorLimite: number;
    entradasRecusadas: number;
    consultasExternas: number;
  };
  configuracao: {
    iaConfigurada: boolean;
    provedor: string | null;
    limiteGeralPorMinuto: number;
    limiteIaPorMinuto: number;
    corpoMaximoKb: number;
    tempoMaximoIaSegundos: number;
    regrasAbnt: number;
    pessoasProtegidasNaDemo: number;
  };
  pendencias: string[];
}

export interface Tarjado {
  protegido: string;
  substituicoes: number;
  resumo: { pessoas: number; emails: number; cpfs: number; telefones: number };
}

export const tarjar = (texto: string) => pedir<Tarjado>('POST', '/api/fortaleza/tarjar', { texto });

/**
 * Busca o relatório e confere, no próprio navegador, os cabeçalhos de segurança que vieram na resposta.
 * (Em respostas da mesma origem o JavaScript enxerga todos os cabeçalhos.)
 */
export async function obterRelatorio(): Promise<{ relatorio: RelatorioFortaleza; cabecalhos: Verificacao[] }> {
  let res: Response;
  try {
    res = await fetch('/api/fortaleza/relatorio');
  } catch {
    throw new ErroApi('Sem conexão com o servidor. Confira se a plataforma está rodando.', 0);
  }
  if (!res.ok) throw new ErroApi('Não consegui gerar o relatório agora. Tente de novo.', res.status);
  const relatorio = (await res.json()) as RelatorioFortaleza;
  const h = (nome: string) => res.headers.get(nome) ?? '';
  const csp = h('content-security-policy');
  const cabecalhos: Verificacao[] = [
    {
      id: 'csp',
      camada: 'Navegador',
      titulo: 'A página só carrega código do próprio Threshold (CSP)',
      comoTestamos: "O navegador lê o cabeçalho Content-Security-Policy desta resposta e confere se scripts só podem vir de 'self'.",
      ok: /script-src[^;]*'self'/.test(csp) && !/script-src[^;]*'unsafe-inline'/.test(csp),
    },
    {
      id: 'nosniff',
      camada: 'Navegador',
      titulo: 'O navegador não "adivinha" o tipo dos arquivos',
      comoTestamos: 'O navegador confere se a resposta trouxe X-Content-Type-Options: nosniff.',
      ok: h('x-content-type-options').toLowerCase() === 'nosniff',
    },
    {
      id: 'moldura',
      camada: 'Navegador',
      titulo: 'Outros sites não conseguem embutir o Threshold numa moldura',
      comoTestamos: 'O navegador confere X-Frame-Options ou a diretiva frame-ancestors da CSP.',
      ok: /^(sameorigin|deny)$/i.test(h('x-frame-options')) || /frame-ancestors/.test(csp),
    },
    {
      id: 'tecnologia',
      camada: 'Navegador',
      titulo: 'O servidor não anuncia a tecnologia que usa',
      comoTestamos: 'O navegador confere que a resposta NÃO trouxe o cabeçalho X-Powered-By.',
      ok: h('x-powered-by') === '',
    },
  ];
  return { relatorio, cabecalhos };
}
