/**
 * Estado da demonstração — DADOS FICTÍCIOS, guardados na memória do servidor.
 *
 * É o que deixa as telas "de verdade": o checklist marcado fica salvo, o pedido de orientação chega ao
 * painel do professor, a devolutiva do professor aparece no dossiê da aluna e as etapas avançam.
 * Ao reiniciar o servidor (ou em POST /api/demo/reiniciar) tudo volta ao começo.
 * Quando houver banco e login, este arquivo é o contrato que o repositório de dados precisa cumprir.
 *
 * Os prazos são relativos ao dia em que a demo começou, para a demonstração nunca "vencer".
 */

export type EstadoEtapa = 'aprovado' | 'atual' | 'em-revisao' | 'classificado';

export interface ItemChecklist {
  id: string;
  texto: string;
  feito: boolean;
  /** Marcado pelo sistema (ex.: "solicitar orientação"); o aluno não alterna à mão. */
  automatico?: boolean;
}

export interface Etapa {
  numero: number;
  titulo: string;
  estado: EstadoEtapa;
  descricao: string;
  checklist: ItemChecklist[];
}

export interface Devolutiva {
  id: number;
  etapa: number;
  autor: string;
  tipo: 'devolutiva' | 'lembrete' | 'sistema';
  texto: string;
  /** Data e hora em ISO 8601. */
  quando: string;
}

export interface Pedido {
  id: number;
  orientadorId: string;
  estado: 'pendente' | 'aceito' | 'recusado';
  quando: string;
}

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

export interface Prazo {
  id: string;
  titulo: string;
  /** AAAA-MM-DD. */
  data: string;
  etapa: number;
  concluido: boolean;
}

interface Orientando {
  id: string;
  nome: string;
  tema: string;
  etapa: number;
  /** Dias de atraso na etapa atual (0 = em dia). */
  diasAtraso: number;
  lembreteEm?: string;
}

export type Situacao = 'em-dia' | 'atrasado' | 'aguardando-revisao';

interface LinhaPainel {
  id: string;
  nome: string;
  tema: string;
  etapa: number;
  tituloEtapa: string;
  situacao: Situacao;
  detalhe: string;
  lembreteEm: string | null;
  /** true só para a aluna da demo: dá para enviar devolutiva e revisar etapa. */
  interativo: boolean;
  checklist: { feitos: number; total: number } | null;
}

/** Erro de regra de negócio, com o status HTTP que a rota deve devolver. */
export class ErroDemo extends Error {
  constructor(
    readonly status: 400 | 403 | 404 | 409,
    message: string,
  ) {
    super(message);
    this.name = 'ErroDemo';
  }
}

export const ALUNA = { id: 'ana', nome: 'Ana Souza', detalhe: '7º período · Eng. de Software' };
const TEMA = 'Acessibilidade em plataformas de ensino';

const TITULOS = ['Tema e problema de pesquisa', 'Escolha do orientador', 'Projeto de pesquisa', 'Desenvolvimento', 'Revisão ABNT', 'Entrega e banca'];

const CHECKLISTS: string[][] = [
  ['Escolher a área de interesse', 'Escrever o problema de pesquisa', 'Enviar o tema à coordenação'],
  ['Ler as fichas de pelo menos dois orientadores', 'Perguntar ao Board sobre a afinidade com o tema', 'Solicitar orientação a um professor'],
  ['Recortar o tema na Sala de Recorte', 'Definir a pergunta de pesquisa e os objetivos', 'Levantar 10 referências e revisar no Archivist', 'Montar o cronograma com o orientador'],
  ['Coletar os dados ou construir o protótipo', 'Registrar os resultados', 'Escrever o rascunho completo'],
  ['Revisar todas as referências no Archivist', 'Conferir as citações no texto', 'Conferir margens, fonte e espaçamento', 'Atualizar o sumário e a numeração'],
  ['Incorporar os ajustes finais do orientador', 'Depositar a versão final', 'Ensaiar a apresentação para a banca'],
];

const ORIENTADORES: Orientador[] = [
  {
    id: 'ricardo-almeida',
    nome: 'Prof. Ricardo Almeida',
    protocolo: 'OR-031',
    curso: 'Engenharia de Software',
    areas: ['Acessibilidade digital', 'Engenharia de software', 'IA aplicada à educação'],
    areaEmDestaque: 'Acessibilidade digital',
    afinidade: 'alta',
    porQue: 'O tema do seu dossiê, acessibilidade em plataformas de ensino, está nas áreas declaradas pelo professor, e ele tem vagas abertas.',
    estilo: ['Reuniões quinzenais', 'Mais estruturado: cronograma combinado no início'],
    vagas: { abertas: 2, total: 5 },
    destaques: ['Devolutivas detalhadas', 'Responde rápido', 'Ajuda a recortar o tema'],
    bomSaber: 'Prefere temas com parte prática.',
  },
  {
    id: 'helena-costa',
    nome: 'Profa. Helena Costa',
    protocolo: 'OR-047',
    curso: 'Design e Engenharia de Software',
    areas: ['Design de interação', 'Usabilidade'],
    areaEmDestaque: 'Usabilidade',
    afinidade: 'média',
    porQue: 'Usabilidade conversa com acessibilidade: ela pode ajudar muito na parte de pesquisa com usuários do seu tema.',
    estilo: ['Reuniões semanais curtas', 'Mais livre: o aluno propõe o ritmo'],
    vagas: { abertas: 1, total: 4 },
    destaques: ['Ótima em metodologia de pesquisa com usuários'],
    bomSaber: 'Agenda concorrida no fim do semestre.',
  },
  {
    id: 'marcos-ferreira',
    nome: 'Prof. Marcos Ferreira',
    protocolo: 'OR-052',
    curso: 'Sistemas de Informação',
    areas: ['Educação a distância', 'Sistemas web'],
    areaEmDestaque: 'Educação a distância',
    afinidade: 'média',
    porQue: 'Seu tema fala de plataformas de ensino, e educação a distância é a área principal dele.',
    estilo: ['Reuniões mensais', 'Muito acompanhamento por e-mail'],
    vagas: { abertas: 3, total: 5 },
    destaques: ['Retorno por escrito bem organizado'],
    bomSaber: 'Espera que o aluno traga pauta pronta para cada reunião.',
  },
];

/** Orientandos inventados que já ocupam as vagas de cada professor (só leitura + lembrete). */
const ORIENTANDOS: Record<string, Orientando[]> = {
  'ricardo-almeida': [
    { id: 'bruno', nome: 'Bruno Lima', tema: 'Testes automatizados em aplicativos de saúde', etapa: 4, diasAtraso: 0 },
    { id: 'carla', nome: 'Carla Dias', tema: 'Chatbots no atendimento acadêmico', etapa: 3, diasAtraso: 5 },
    { id: 'diego', nome: 'Diego Rocha', tema: 'Gamificação no ensino de lógica', etapa: 5, diasAtraso: 0 },
  ],
  'helena-costa': [
    { id: 'elisa', nome: 'Elisa Prado', tema: 'Onboarding em aplicativos bancários', etapa: 4, diasAtraso: 0 },
    { id: 'fabio', nome: 'Fábio Nunes', tema: 'Legibilidade em leitores digitais', etapa: 3, diasAtraso: 2 },
    { id: 'gabriela', nome: 'Gabriela Reis', tema: 'Design de formulários acessíveis', etapa: 6, diasAtraso: 0 },
  ],
  'marcos-ferreira': [
    { id: 'heitor', nome: 'Heitor Brito', tema: 'Evasão em cursos a distância', etapa: 3, diasAtraso: 0 },
    { id: 'iara', nome: 'Iara Campos', tema: 'Avaliação por pares em ambientes virtuais', etapa: 5, diasAtraso: 8 },
  ],
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const maisDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const diaMes = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
const copiar = <T>(v: T): T => structuredClone(v);

export type EstadoDemo = ReturnType<typeof criarEstadoDemo>;

export function criarEstadoDemo(agora: () => Date = () => new Date()) {
  let inicio = agora();
  let etapas: Etapa[] = [];
  let orientadores: Orientador[] = [];
  let orientandos: Record<string, Orientando[]> = {};
  let devolutivas: Devolutiva[] = [];
  let pedido: Pedido | null = null;
  let orientadorId: string | null = null;
  let proximoId = 1;

  const prazoOrientador = () => maisDias(inicio, 9);
  const prazoProjeto = () => maisDias(inicio, 30);
  const entregaOficial = () => maisDias(inicio, 58);

  function reiniciar() {
    inicio = agora();
    orientadores = copiar(ORIENTADORES);
    orientandos = copiar(ORIENTANDOS);
    devolutivas = [];
    pedido = null;
    orientadorId = null;
    proximoId = 1;
    etapas = TITULOS.map((titulo, i) => ({
      numero: i + 1,
      titulo,
      estado: i === 0 ? 'aprovado' : i === 1 ? 'atual' : 'classificado',
      descricao:
        i === 0
          ? `Aprovado pela coordenação em ${diaMes(maisDias(inicio, -17))}`
          : i === 1
            ? `Falta: solicitar orientação a um professor até ${diaMes(prazoOrientador())}`
            : '',
      checklist: (CHECKLISTS[i] ?? []).map((texto, j) => ({
        id: `e${i + 1}-${j + 1}`,
        texto,
        feito: i === 0,
        ...(i === 1 && j === 2 ? { automatico: true } : {}),
      })),
    }));
  }
  reiniciar();

  const etapa = (numero: number) => etapas.find((e) => e.numero === numero);
  const etapaAtual = () => etapas.find((e) => e.estado === 'atual' || e.estado === 'em-revisao');
  const orientador = (id: string) => {
    const o = orientadores.find((x) => x.id === id);
    if (!o) throw new ErroDemo(404, 'Orientador não encontrado.');
    return o;
  };
  const registrar = (d: Omit<Devolutiva, 'id' | 'quando'>) => {
    devolutivas.unshift({ ...d, id: proximoId++, quando: agora().toISOString() });
  };

  function prazos(): Prazo[] {
    const aprovada = (n: number) => etapa(n)?.estado === 'aprovado';
    return [
      { id: 'orientador', titulo: 'Solicitar orientação a um professor', data: iso(prazoOrientador()), etapa: 2, concluido: aprovada(2) || pedido?.estado === 'pendente' },
      { id: 'projeto', titulo: 'Entregar o projeto de pesquisa', data: iso(prazoProjeto()), etapa: 3, concluido: aprovada(3) },
      { id: 'entrega', titulo: 'Entrega oficial do TCC', data: iso(entregaOficial()), etapa: 6, concluido: aprovada(6) },
    ];
  }

  /** O que o aluno vê em GET /api/dossie. */
  function dossie() {
    const o = orientadorId ? orientador(orientadorId) : null;
    return copiar({
      aluna: { nome: ALUNA.nome, detalhe: ALUNA.detalhe },
      protocolo: 'TH-2026-0142',
      tema: TEMA,
      entregaOficial: iso(entregaOficial()),
      etapas,
      prazos: prazos(),
      orientador: o ? { id: o.id, nome: o.nome } : null,
      pedido: pedido ? { ...pedido, orientadorNome: orientador(pedido.orientadorId).nome } : null,
      devolutivas,
      concluido: etapas.every((e) => e.estado === 'aprovado'),
    });
  }

  function alternarItem(id: string, feito: boolean) {
    const dona = etapas.find((e) => e.checklist.some((i) => i.id === id));
    const item = dona?.checklist.find((i) => i.id === id);
    if (!dona || !item) throw new ErroDemo(404, 'Item do checklist não encontrado.');
    if (dona.estado !== 'atual') throw new ErroDemo(409, 'Só dá para marcar itens da etapa em andamento.');
    if (item.automatico) throw new ErroDemo(409, 'Este item é marcado sozinho quando você conclui a ação na plataforma.');
    item.feito = feito;
    return dossie();
  }

  function pedirOrientacao(id: string) {
    const o = orientador(id);
    const e2 = etapa(2)!;
    if (e2.estado !== 'atual') throw new ErroDemo(409, 'Você já tem orientador.');
    if (pedido?.estado === 'pendente') throw new ErroDemo(409, `Você já tem um pedido aguardando resposta de ${orientador(pedido.orientadorId).nome}.`);
    if (o.vagas.abertas < 1) throw new ErroDemo(409, 'Este professor não tem vagas abertas neste semestre.');
    pedido = { id: proximoId++, orientadorId: id, estado: 'pendente', quando: agora().toISOString() };
    e2.checklist.find((i) => i.automatico)!.feito = true;
    e2.descricao = `Pedido enviado a ${o.nome} em ${diaMes(agora())}. Aguardando resposta.`;
    return dossie();
  }

  function cancelarPedido() {
    if (pedido?.estado !== 'pendente') throw new ErroDemo(409, 'Não há pedido aguardando resposta.');
    pedido = null;
    const e2 = etapa(2)!;
    e2.checklist.find((i) => i.automatico)!.feito = false;
    e2.descricao = `Falta: solicitar orientação a um professor até ${diaMes(prazoOrientador())}`;
    return dossie();
  }

  function enviarParaRevisao() {
    const atual = etapas.find((e) => e.estado === 'atual');
    if (!atual || atual.numero < 3) throw new ErroDemo(409, 'Esta etapa não é enviada para revisão.');
    if (!orientadorId) throw new ErroDemo(409, 'Você ainda não tem orientador.');
    if (atual.checklist.some((i) => !i.feito)) throw new ErroDemo(409, 'Conclua todos os itens do checklist antes de enviar.');
    atual.estado = 'em-revisao';
    atual.descricao = `Enviada para ${orientador(orientadorId).nome} em ${diaMes(agora())}. Aguardando revisão.`;
    return dossie();
  }

  // ---------- Lado do orientador ----------

  function painel(id: string) {
    const o = orientador(id);
    const atual = etapaAtual();
    const lista: LinhaPainel[] = (orientandos[id] ?? []).map((x) => ({
      id: x.id,
      nome: x.nome,
      tema: x.tema,
      etapa: x.etapa,
      tituloEtapa: TITULOS[x.etapa - 1] ?? '',
      situacao: x.diasAtraso > 0 ? 'atrasado' : 'em-dia',
      detalhe: x.diasAtraso > 0 ? `${x.diasAtraso} dia(s) de atraso na etapa` : 'Em dia',
      lembreteEm: x.lembreteEm ?? null,
      interativo: false,
      checklist: null,
    }));
    if (orientadorId === id) {
      const lembrete = devolutivas.find((d) => d.tipo === 'lembrete');
      lista.unshift({
        id: ALUNA.id,
        nome: ALUNA.nome,
        tema: TEMA,
        etapa: atual?.numero ?? 6,
        tituloEtapa: atual?.titulo ?? 'TCC concluído',
        situacao: atual?.estado === 'em-revisao' ? 'aguardando-revisao' : 'em-dia',
        detalhe: !atual ? 'Todas as etapas aprovadas' : atual.estado === 'em-revisao' ? 'Enviou a etapa e aguarda a sua revisão' : 'Em dia',
        lembreteEm: lembrete?.quando ?? null,
        interativo: true,
        checklist: atual ? { feitos: atual.checklist.filter((i) => i.feito).length, total: atual.checklist.length } : null,
      });
    }
    const pedidos =
      pedido?.estado === 'pendente' && pedido.orientadorId === id
        ? [{ id: pedido.id, aluna: { nome: ALUNA.nome, detalhe: ALUNA.detalhe }, tema: TEMA, quando: pedido.quando, afinidade: o.afinidade, areaEmComum: o.areaEmDestaque }]
        : [];
    return copiar({
      orientador: { id: o.id, nome: o.nome, curso: o.curso, vagas: o.vagas },
      professores: orientadores.map((x) => ({ id: x.id, nome: x.nome })),
      pedidos,
      orientandos: lista,
      devolutivas: orientadorId === id ? devolutivas.filter((d) => d.tipo !== 'sistema') : [],
      resumo: {
        orientandos: lista.length,
        vagasAbertas: o.vagas.abertas,
        aguardandoRevisao: lista.filter((x) => x.situacao === 'aguardando-revisao').length,
        atrasados: lista.filter((x) => x.situacao === 'atrasado').length,
        pedidosPendentes: pedidos.length,
      },
    });
  }

  function responderPedido(id: string, pedidoId: number, aceitar: boolean) {
    const o = orientador(id);
    if (!pedido || pedido.id !== pedidoId || pedido.orientadorId !== id || pedido.estado !== 'pendente') {
      throw new ErroDemo(404, 'Pedido não encontrado ou já respondido.');
    }
    const e2 = etapa(2)!;
    if (aceitar) {
      if (o.vagas.abertas < 1) throw new ErroDemo(409, 'Sem vagas abertas para aceitar o pedido.');
      o.vagas.abertas -= 1;
      pedido.estado = 'aceito';
      orientadorId = id;
      e2.estado = 'aprovado';
      e2.checklist.forEach((i) => (i.feito = true));
      e2.descricao = `Orientação aceita por ${o.nome} em ${diaMes(agora())}`;
      const e3 = etapa(3)!;
      e3.estado = 'atual';
      e3.descricao = `Falta: entregar o projeto de pesquisa até ${diaMes(prazoProjeto())}`;
      registrar({ etapa: 2, autor: o.nome, tipo: 'sistema', texto: `${o.nome} aceitou o seu pedido de orientação. A etapa 3 foi liberada.` });
    } else {
      pedido.estado = 'recusado';
      e2.checklist.find((i) => i.automatico)!.feito = false;
      e2.descricao = `Falta: solicitar orientação a um professor até ${diaMes(prazoOrientador())}`;
      registrar({ etapa: 2, autor: o.nome, tipo: 'sistema', texto: `${o.nome} não pôde aceitar o pedido neste semestre. Veja as outras fichas compatíveis.` });
    }
    return painel(id);
  }

  const exigirOrientadorDaAna = (id: string) => {
    const o = orientador(id);
    if (orientadorId !== id) throw new ErroDemo(403, 'Só o orientador da aluna pode fazer isso.');
    return o;
  };

  function enviarDevolutiva(id: string, texto: string) {
    const o = exigirOrientadorDaAna(id);
    registrar({ etapa: etapaAtual()?.numero ?? 6, autor: o.nome, tipo: 'devolutiva', texto });
    return painel(id);
  }

  function revisarEtapa(id: string, decisao: 'aprovar' | 'devolver', texto?: string) {
    const o = exigirOrientadorDaAna(id);
    const emRevisao = etapas.find((e) => e.estado === 'em-revisao');
    if (!emRevisao) throw new ErroDemo(409, 'Não há etapa aguardando revisão.');
    if (decisao === 'devolver') {
      if (!texto) throw new ErroDemo(400, 'Explique o que precisa ser ajustado.');
      emRevisao.estado = 'atual';
      emRevisao.descricao = `Devolvida para ajustes por ${o.nome} em ${diaMes(agora())}`;
      registrar({ etapa: emRevisao.numero, autor: o.nome, tipo: 'devolutiva', texto });
      return painel(id);
    }
    emRevisao.estado = 'aprovado';
    emRevisao.descricao = `Aprovada por ${o.nome} em ${diaMes(agora())}`;
    if (texto) registrar({ etapa: emRevisao.numero, autor: o.nome, tipo: 'devolutiva', texto });
    const proxima = etapa(emRevisao.numero + 1);
    if (proxima) {
      proxima.estado = 'atual';
      proxima.descricao = proxima.numero === 6 ? `Entrega oficial em ${diaMes(entregaOficial())}` : 'Etapa liberada. Siga o checklist.';
    }
    registrar({
      etapa: emRevisao.numero,
      autor: o.nome,
      tipo: 'sistema',
      texto: proxima ? `Etapa ${emRevisao.numero} aprovada. A etapa ${proxima.numero} (${proxima.titulo}) foi liberada.` : 'Todas as etapas aprovadas. Parabéns!',
    });
    return painel(id);
  }

  function enviarLembrete(id: string, orientandoId: string) {
    const o = orientador(id);
    const hoje = iso(agora());
    if (orientandoId === ALUNA.id) {
      exigirOrientadorDaAna(id);
      if (devolutivas.some((d) => d.tipo === 'lembrete' && d.quando.slice(0, 10) === agora().toISOString().slice(0, 10))) {
        throw new ErroDemo(409, 'A Hotline já lembrou esta aluna hoje.');
      }
      const atual = etapaAtual();
      registrar({
        etapa: atual?.numero ?? 6,
        autor: o.nome,
        tipo: 'lembrete',
        texto: atual ? `Lembrete da Hotline, a pedido do orientador: a etapa "${atual.titulo}" precisa de atenção.` : 'Lembrete da Hotline, a pedido do orientador.',
      });
      return painel(id);
    }
    const alvo = (orientandos[id] ?? []).find((x) => x.id === orientandoId);
    if (!alvo) throw new ErroDemo(404, 'Orientando não encontrado.');
    if (alvo.lembreteEm?.slice(0, 10) === hoje) throw new ErroDemo(409, 'A Hotline já lembrou este orientando hoje.');
    alvo.lembreteEm = `${hoje}T00:00:00.000Z`;
    return painel(id);
  }

  /** Contexto que a Hotline e o Board recebem: só estrutura (nada de texto livre de devolutiva, por causa de prompt injection). */
  function contextoParaIA() {
    const o = orientadorId ? orientador(orientadorId) : null;
    const rotulo: Record<EstadoEtapa, string> = { aprovado: 'aprovada', atual: 'atual', 'em-revisao': 'em revisão pelo orientador', classificado: 'bloqueada' };
    const br = (d: Date) => `${diaMes(d)}/${d.getFullYear()}`;
    return {
      dossie: {
        tema: TEMA,
        entregaOficial: br(entregaOficial()),
        orientador: o?.nome ?? null,
        etapas: etapas.map((e) => {
          const faltam = e.checklist.filter((i) => !i.feito).map((i) => i.texto);
          const partes = [e.descricao.replace(/^Falta: /, 'falta ')];
          if ((e.estado === 'atual' || e.estado === 'em-revisao') && faltam.length) partes.push(`itens em aberto: ${faltam.join('; ')}`);
          return { numero: e.numero, titulo: e.titulo, estado: rotulo[e.estado], detalhe: partes.filter(Boolean).join('. ') };
        }),
      },
      orientadores: orientadores.map((x) => ({
        nome: x.nome.replace(/^Profa?\. /, ''),
        areas: x.areas.map((a) => a.toLowerCase()),
        estilo: x.estilo.join('; ').toLowerCase(),
        vagas: `${x.vagas.abertas} de ${x.vagas.total} abertas`,
        destaques: x.destaques.map((d) => d.toLowerCase()),
        atencao: x.bomSaber.toLowerCase().replace(/\.$/, ''),
      })),
    };
  }

  return {
    reiniciar: () => {
      reiniciar();
      return dossie();
    },
    dossie,
    orientadores: () => copiar(orientadores),
    alternarItem,
    pedirOrientacao,
    cancelarPedido,
    enviarParaRevisao,
    painel,
    responderPedido,
    enviarDevolutiva,
    revisarEtapa,
    enviarLembrete,
    contextoParaIA,
  };
}
