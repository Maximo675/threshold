import type { IdAgente } from '../api/lantern';

/** Os agentes do Threshold, com nomes inspirados no universo de arquivo paranormal (sem marcas de terceiros). */
export const AGENTES: Record<IdAgente, { nome: string; papel: string; descricao: string }> = {
  lantern: { nome: 'Lantern', papel: 'Guia', descricao: 'A voz da plataforma. Ilumina o próximo passo e chama o especialista certo.' },
  archivist: { nome: 'Archivist', papel: 'Normas ABNT', descricao: 'O arquivista: confere referências e explica cada regra da NBR 6023.' },
  hotline: { nome: 'Hotline', papel: 'Etapas e prazos', descricao: 'A linha direta: diz em que etapa você está e o que fazer agora.' },
  board: { nome: 'Board', papel: 'Orientação', descricao: 'O conselho: sugere orientadores por afinidade com o seu tema.' },
};

export const SUGESTOES = [
  'Revise esta referência: souza, marina. Métodos de pesquisa em computação. 2 ed. Curitiba: Editora Exemplo, 2021.',
  'Qual é o meu próximo passo no TCC?',
  'Que orientador combina com o meu tema?',
  'Escreve a introdução do meu TCC?',
];
