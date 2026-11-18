import { vi } from 'vitest';
import type { Dossie, Orientador, Painel } from '../api/threshold';

/**
 * API de mentira para os testes das telas: troca o fetch por respostas combinadas.
 * Chave da rota: "MÉTODO /caminho" (ex.: "POST /api/dossie/pedido"). Nenhuma chamada sai para a rede.
 */
interface Resposta {
  status?: number;
  corpo: unknown;
  cabecalhos?: Record<string, string>;
}

export function simularApi(rotas: Record<string, Resposta | ((corpo: never) => Resposta)>) {
  const chamadas: { chave: string; corpo: unknown }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const chave = `${init?.method ?? 'GET'} ${url}`;
      const corpo = init?.body ? JSON.parse(String(init.body)) : undefined;
      chamadas.push({ chave, corpo });
      const rota = rotas[chave];
      if (!rota) return new Response(JSON.stringify({ erro: 'Rota não encontrada.' }), { status: 404 });
      const r = typeof rota === 'function' ? rota(corpo as never) : rota;
      return new Response(JSON.stringify(r.corpo), { status: r.status ?? 200, headers: { 'content-type': 'application/json', ...r.cabecalhos } });
    }),
  );
  return chamadas;
}

const item = (id: string, texto: string, feito = false, automatico = false) => ({ id, texto, feito, ...(automatico ? { automatico } : {}) });

/** Dossiê no começo da demonstração: etapa 2 em andamento, sem orientador. */
export function dossieBase(extra: Partial<Dossie> = {}): Dossie {
  return {
    aluna: { nome: 'Ana Souza', detalhe: '7º período · Eng. de Software' },
    protocolo: 'TH-2026-0142',
    tema: 'Acessibilidade em plataformas de ensino',
    entregaOficial: '2099-01-11',
    etapas: [
      { numero: 1, titulo: 'Tema e problema de pesquisa', estado: 'aprovado', descricao: 'Aprovado pela coordenação', checklist: [item('e1-1', 'Escolher a área', true)] },
      {
        numero: 2,
        titulo: 'Escolha do orientador',
        estado: 'atual',
        descricao: 'Falta: solicitar orientação a um professor até 23/11',
        checklist: [item('e2-1', 'Ler as fichas de pelo menos dois orientadores'), item('e2-2', 'Perguntar ao Board sobre a afinidade com o tema'), item('e2-3', 'Solicitar orientação a um professor', false, true)],
      },
      { numero: 3, titulo: 'Projeto de pesquisa', estado: 'classificado', descricao: '', checklist: [item('e3-1', 'Recortar o tema na Sala de Recorte'), item('e3-2', 'Definir a pergunta de pesquisa')] },
      { numero: 4, titulo: 'Desenvolvimento', estado: 'classificado', descricao: '', checklist: [] },
      { numero: 5, titulo: 'Revisão ABNT', estado: 'classificado', descricao: '', checklist: [] },
      { numero: 6, titulo: 'Entrega e banca', estado: 'classificado', descricao: '', checklist: [] },
    ],
    prazos: [
      { id: 'orientador', titulo: 'Solicitar orientação a um professor', data: '2099-01-01', etapa: 2, concluido: false },
      { id: 'entrega', titulo: 'Entrega oficial do TCC', data: '2099-01-11', etapa: 6, concluido: false },
    ],
    orientador: null,
    pedido: null,
    devolutivas: [],
    concluido: false,
    ...extra,
  };
}

/** Dossiê depois que o Prof. Ricardo aceitou: etapa 3 em andamento. */
export function dossieComOrientador(extra: Partial<Dossie> = {}): Dossie {
  const base = dossieBase();
  base.etapas[1] = { ...base.etapas[1]!, estado: 'aprovado', descricao: 'Orientação aceita por Prof. Ricardo Almeida' };
  base.etapas[2] = { ...base.etapas[2]!, estado: 'atual', descricao: 'Falta: entregar o projeto de pesquisa até 14/12' };
  return {
    ...base,
    orientador: { id: 'ricardo-almeida', nome: 'Prof. Ricardo Almeida' },
    pedido: { id: 1, orientadorId: 'ricardo-almeida', orientadorNome: 'Prof. Ricardo Almeida', estado: 'aceito', quando: '2026-11-14T13:00:00.000Z' },
    ...extra,
  };
}

export function orientadoresBase(): Orientador[] {
  return [
    {
      id: 'ricardo-almeida',
      nome: 'Prof. Ricardo Almeida',
      protocolo: 'OR-031',
      curso: 'Engenharia de Software',
      areas: ['Acessibilidade digital', 'Engenharia de software'],
      areaEmDestaque: 'Acessibilidade digital',
      afinidade: 'alta',
      porQue: 'O tema do seu dossiê está nas áreas declaradas pelo professor, e ele tem vagas abertas.',
      estilo: ['Reuniões quinzenais'],
      vagas: { abertas: 2, total: 5 },
      destaques: ['Devolutivas detalhadas'],
      bomSaber: 'Prefere temas com parte prática.',
    },
    {
      id: 'helena-costa',
      nome: 'Profa. Helena Costa',
      protocolo: 'OR-047',
      curso: 'Design',
      areas: ['Design de interação', 'Usabilidade'],
      areaEmDestaque: 'Usabilidade',
      afinidade: 'média',
      porQue: 'Usabilidade conversa com acessibilidade.',
      estilo: ['Reuniões semanais curtas'],
      vagas: { abertas: 1, total: 4 },
      destaques: ['Ótima em metodologia'],
      bomSaber: 'Agenda concorrida no fim do semestre.',
    },
  ];
}

export function painelBase(extra: Partial<Painel> = {}): Painel {
  return {
    orientador: { id: 'ricardo-almeida', nome: 'Prof. Ricardo Almeida', curso: 'Engenharia de Software', vagas: { abertas: 2, total: 5 } },
    professores: [
      { id: 'ricardo-almeida', nome: 'Prof. Ricardo Almeida' },
      { id: 'helena-costa', nome: 'Profa. Helena Costa' },
    ],
    pedidos: [],
    orientandos: [
      { id: 'bruno', nome: 'Bruno Lima', tema: 'Testes automatizados', etapa: 4, tituloEtapa: 'Desenvolvimento', situacao: 'em-dia', detalhe: 'Em dia', lembreteEm: null, interativo: false, checklist: null },
      { id: 'carla', nome: 'Carla Dias', tema: 'Chatbots', etapa: 3, tituloEtapa: 'Projeto de pesquisa', situacao: 'atrasado', detalhe: '5 dia(s) de atraso na etapa', lembreteEm: null, interativo: false, checklist: null },
    ],
    devolutivas: [],
    resumo: { orientandos: 2, vagasAbertas: 2, aguardandoRevisao: 0, atrasados: 1, pedidosPendentes: 0 },
    ...extra,
  };
}

export const anaNoPainel = (situacao: 'em-dia' | 'aguardando-revisao' = 'em-dia'): Painel['orientandos'][number] => ({
  id: 'ana',
  nome: 'Ana Souza',
  tema: 'Acessibilidade em plataformas de ensino',
  etapa: 3,
  tituloEtapa: 'Projeto de pesquisa',
  situacao,
  detalhe: situacao === 'em-dia' ? 'Em dia' : 'Enviou a etapa e aguarda a sua revisão',
  lembreteEm: null,
  interativo: true,
  checklist: { feitos: 1, total: 2 },
});
