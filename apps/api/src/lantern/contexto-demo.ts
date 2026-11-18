/**
 * DADOS FICTÍCIOS da demonstração. Nenhuma pessoa real.
 * Quando houver banco e login, estes dados virão do dossiê e dos perfis de verdade.
 * Os mesmos dados aparecem nas telas do front (apps/web/src/data/ficticio.ts) e no Figma.
 */
import type { Identidade } from '../security/pseudonimizar.js';

export const alunaDemo = { nome: 'Ana Souza', curso: 'Engenharia de Software', periodo: '7º período' };

export const dossieDemo = {
  tema: 'Acessibilidade em plataformas de ensino',
  entregaOficial: '16/12/2026',
  etapas: [
    { numero: 1, titulo: 'Tema e problema de pesquisa', estado: 'aprovado', detalhe: 'aprovado pela coordenação em 02/10' },
    { numero: 2, titulo: 'Escolha do orientador', estado: 'atual', detalhe: 'falta solicitar orientação a um professor até 30/10' },
    { numero: 3, titulo: 'Projeto de pesquisa', estado: 'bloqueada', detalhe: 'libera depois da etapa 2; entrega do projeto até 20/11' },
    { numero: 4, titulo: 'Desenvolvimento', estado: 'bloqueada', detalhe: '' },
    { numero: 5, titulo: 'Revisão ABNT', estado: 'bloqueada', detalhe: '' },
    { numero: 6, titulo: 'Entrega e banca', estado: 'bloqueada', detalhe: 'entrega oficial em 16/12/2026' },
  ],
};

export const orientadoresDemo = [
  {
    nome: 'Ricardo Almeida',
    areas: ['acessibilidade digital', 'engenharia de software', 'IA aplicada à educação'],
    estilo: 'reuniões quinzenais; mais estruturado, cronograma combinado no início',
    vagas: '2 de 5 abertas',
    destaques: ['devolutivas detalhadas', 'responde rápido', 'ajuda a recortar o tema'],
    atencao: 'prefere temas com parte prática',
  },
  {
    nome: 'Helena Costa',
    areas: ['design de interação', 'usabilidade'],
    estilo: 'reuniões semanais curtas; mais livre',
    vagas: '1 de 4 aberta',
    destaques: ['ótima em metodologia de pesquisa com usuários'],
    atencao: 'agenda concorrida no fim do semestre',
  },
  {
    nome: 'Marcos Ferreira',
    areas: ['educação a distância', 'sistemas web'],
    estilo: 'reuniões mensais e muito acompanhamento por e-mail',
    vagas: '3 de 5 abertas',
    destaques: ['retorno por escrito bem organizado'],
    atencao: 'espera que o aluno traga pauta pronta para cada reunião',
  },
];

/** Pessoas da plataforma que a pseudonimização troca por códigos antes de ir para a IA. */
export const identidadesDemo: Identidade[] = [
  { tipo: 'ALUNO', nome: alunaDemo.nome },
  ...orientadoresDemo.map((o) => ({ tipo: 'PROFESSOR' as const, nome: o.nome })),
];
