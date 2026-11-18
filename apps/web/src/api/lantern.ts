/** Cliente da API da Lantern. A chave da IA NUNCA passa por aqui: só o servidor fala com o provedor. */

export type IdAgente = 'lantern' | 'archivist' | 'hotline' | 'board';

export interface MensagemConversa {
  papel: 'aluno' | 'lantern';
  texto: string;
}

export interface RespostaLantern {
  agente: IdAgente;
  nomeAgente: string;
  texto: string;
  protecao: { enviadoAIA: string; substituicoes: number };
}

export class ErroLantern extends Error {
  readonly status: number;
  readonly codigo?: string;
  /** Só no limite por minuto (429): quantos segundos faltam para poder perguntar de novo. */
  readonly tenteEmSegundos?: number;

  constructor(message: string, status: number, codigo?: string, tenteEmSegundos?: number) {
    super(message);
    this.name = 'ErroLantern';
    this.status = status;
    this.codigo = codigo;
    this.tenteEmSegundos = tenteEmSegundos;
  }
}

export async function statusLantern(): Promise<{ online: boolean }> {
  try {
    const res = await fetch('/api/lantern/status');
    if (!res.ok) return { online: false };
    return (await res.json()) as { online: boolean };
  } catch {
    return { online: false };
  }
}

export async function enviarMensagem(mensagens: MensagemConversa[]): Promise<RespostaLantern> {
  let res: Response;
  try {
    res = await fetch('/api/lantern/mensagens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mensagens }),
    });
  } catch {
    throw new ErroLantern('Sem conexão com o servidor. Confira se a plataforma está rodando.', 0);
  }
  const corpo = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ErroLantern(
      corpo.erro ?? 'Algo deu errado. Tente de novo.',
      res.status,
      corpo.codigo,
      typeof corpo.tenteEmSegundos === 'number' ? corpo.tenteEmSegundos : undefined,
    );
  return corpo as RespostaLantern;
}

// ---------- Sala de Recorte ----------

export type IdFicha = 'interesse' | 'problema' | 'publico' | 'contexto' | 'viabilidade';
export type Fichas = Record<IdFicha, string>;

export interface Recorte {
  titulo: string;
  pergunta: string;
  porQue: string;
  risco: string;
  primeiroPasso: string;
  ligacoes: IdFicha[];
}

export interface RespostaRecorte {
  recortes: Recorte[];
  perguntaParaVoce: string;
  protecao: { enviadoAIA: string; substituicoes: number };
}

export async function ligarOsFios(fichas: Fichas): Promise<RespostaRecorte> {
  let res: Response;
  try {
    res = await fetch('/api/lantern/recorte', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fichas }),
    });
  } catch {
    throw new ErroLantern('Sem conexão com o servidor. Confira se a plataforma está rodando.', 0);
  }
  const corpo = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ErroLantern(
      corpo.erro ?? 'Algo deu errado. Tente de novo.',
      res.status,
      corpo.codigo,
      typeof corpo.tenteEmSegundos === 'number' ? corpo.tenteEmSegundos : undefined,
    );
  return corpo as RespostaRecorte;
}
