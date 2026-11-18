/**
 * Provedores de IA. A Lantern fala com o modelo só por esta interface, então trocar de provedor
 * é mudar o .env, não o código. A chave da API fica SÓ no servidor e nunca vai para o navegador.
 */
export interface MensagemIA {
  papel: 'user' | 'assistant';
  texto: string;
}

/** Só metadados da resposta (nunca o texto): servem para o log dizer por que algo deu errado. */
export interface InfoResposta {
  /** Por que o modelo parou. 'max_tokens' = a resposta foi cortada pelo teto de tokens. */
  motivo?: string;
  /** Tokens gerados, contando o raciocínio interno do modelo quando ele existe. */
  tokensSaida?: number;
}

export interface PedidoIA {
  sistema: string;
  mensagens: MensagemIA[];
  /**
   * Teto da resposta. Atenção: nos modelos Claude atuais o raciocínio interno ("adaptive thinking") vem ligado
   * por padrão e CONTA neste teto. Um teto justo para o texto final faz a resposta sair cortada ou vazia.
   */
  maxTokens: number;
  signal?: AbortSignal;
  /** Chamado a cada resposta do provedor, inclusive as cortadas. */
  aoTerminar?: (info: InfoResposta) => void;
}

export interface ProvedorIA {
  nome: string;
  responder(pedido: PedidoIA): Promise<string>;
}

export class ErroProvedorIA extends Error {
  constructor(
    message: string,
    readonly status?: number,
    /** Motivo da parada, quando o provedor respondeu 200 mas sem texto aproveitável. */
    readonly motivo?: string,
  ) {
    super(message);
    this.name = 'ErroProvedorIA';
  }
}

type Fetch = typeof fetch;

/**
 * Claude (Anthropic) — Messages API.
 * Doc: https://platform.claude.com/docs/en/build-with-claude/working-with-messages
 * Os modelos atuais não aceitam temperature nem resposta pré-preenchida; por isso não enviamos.
 *
 * Raciocínio interno: no Claude Haiku 5.5 ele vem ligado por padrão e os tokens dele entram em max_tokens
 * (doc: https://platform.claude.com/docs/en/build-with-claude/thinking). Por isso os tetos das rotas são folgados
 * e lemos stop_reason: 'max_tokens' significa resposta cortada. Os blocos de raciocínio não são texto e ficam de fora.
 */
export function provedorAnthropic(opcoes: { chave: string; modelo: string; urlBase?: string; fetch?: Fetch }): ProvedorIA {
  const f = opcoes.fetch ?? fetch;
  const url = `${(opcoes.urlBase ?? 'https://api.anthropic.com').replace(/\/$/, '')}/v1/messages`;
  return {
    nome: 'anthropic',
    async responder({ sistema, mensagens, maxTokens, signal, aoTerminar }) {
      const res = await f(url, {
        method: 'POST',
        signal,
        headers: {
          'x-api-key': opcoes.chave,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: opcoes.modelo,
          max_tokens: maxTokens,
          system: sistema,
          messages: mensagens.map((m) => ({ role: m.papel, content: m.texto })),
        }),
      });
      if (!res.ok) throw new ErroProvedorIA(`Anthropic respondeu ${res.status}`, res.status);
      const corpo = (await res.json()) as {
        content?: { type: string; text?: string }[];
        stop_reason?: string | null;
        usage?: { output_tokens?: number };
      };
      const motivo = corpo.stop_reason ?? undefined;
      aoTerminar?.({ motivo, tokensSaida: corpo.usage?.output_tokens });
      const texto = (corpo.content ?? [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('')
        .trim();
      if (!texto) {
        throw new ErroProvedorIA(
          motivo === 'max_tokens' ? 'Anthropic: o teto de tokens acabou antes do texto' : 'Anthropic devolveu resposta vazia',
          undefined,
          motivo,
        );
      }
      return texto;
    },
  };
}

/**
 * Qualquer API compatível com a de chat da OpenAI: OpenAI, Groq, OpenRouter, e o Ollama local
 * (gratuito, roda na sua máquina: LLM_URL_BASE=http://host.docker.internal:11434/v1).
 */
export function provedorCompativelOpenAI(opcoes: { chave?: string; modelo: string; urlBase?: string; fetch?: Fetch }): ProvedorIA {
  const f = opcoes.fetch ?? fetch;
  const url = `${(opcoes.urlBase ?? 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`;
  return {
    nome: 'openai',
    async responder({ sistema, mensagens, maxTokens, signal, aoTerminar }) {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (opcoes.chave) headers.authorization = `Bearer ${opcoes.chave}`;
      const res = await f(url, {
        method: 'POST',
        signal,
        headers,
        body: JSON.stringify({
          model: opcoes.modelo,
          max_tokens: maxTokens,
          messages: [{ role: 'system', content: sistema }, ...mensagens.map((m) => ({ role: m.papel, content: m.texto }))],
        }),
      });
      if (!res.ok) throw new ErroProvedorIA(`Provedor respondeu ${res.status}`, res.status);
      const corpo = (await res.json()) as {
        choices?: { message?: { content?: string }; finish_reason?: string | null }[];
        usage?: { completion_tokens?: number };
      };
      // 'length' é o nome que esta API dá para "cortada pelo teto": usamos o mesmo nome nos dois provedores
      const fim = corpo.choices?.[0]?.finish_reason ?? undefined;
      const motivo = fim === 'length' ? 'max_tokens' : fim;
      aoTerminar?.({ motivo, tokensSaida: corpo.usage?.completion_tokens });
      const texto = corpo.choices?.[0]?.message?.content?.trim();
      if (!texto) throw new ErroProvedorIA('Provedor devolveu resposta vazia', undefined, motivo);
      return texto;
    },
  };
}

/** Falhas passageiras: rede caiu (TypeError "fetch failed", ex.: ECONNRESET) ou o provedor pediu calma/está sobrecarregado. */
const STATUS_PASSAGEIROS = new Set([408, 409, 425, 429, 500, 502, 503, 504, 529]);

export function falhaPassageira(erro: unknown): boolean {
  if (erro instanceof ErroProvedorIA) return erro.status !== undefined && STATUS_PASSAGEIROS.has(erro.status);
  return erro instanceof TypeError; // é assim que o fetch do Node avisa erro de rede
}

function esperar(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(signal.reason);
    }, { once: true });
  });
}

/**
 * Tenta de novo, sozinha, quando a falha é passageira (internet do celular oscilando, provedor sobrecarregado).
 * Antes, o aluno precisava clicar em "Enviar" várias vezes. Respeita o tempo máximo da rota (o mesmo signal):
 * se o tempo acabar no meio, para na hora. Erros definitivos (chave errada, pedido inválido) não são repetidos.
 */
export function comRetentativas(provedor: ProvedorIA, esperasMs: number[] = [500, 1500]): ProvedorIA {
  return {
    nome: provedor.nome,
    async responder(pedido) {
      for (let tentativa = 0; ; tentativa++) {
        try {
          return await provedor.responder(pedido);
        } catch (erro) {
          const ultima = tentativa >= esperasMs.length;
          if (ultima || pedido.signal?.aborted || !falhaPassageira(erro)) throw erro;
          await esperar(esperasMs[tentativa] ?? 0, pedido.signal);
        }
      }
    },
  };
}

/** Monta o provedor a partir da configuração. Sem configuração completa → null (Lantern offline). */
export function criarProvedor(config: {
  LLM_PROVEDOR?: 'anthropic' | 'openai';
  LLM_API_KEY?: string;
  LLM_MODELO?: string;
  LLM_URL_BASE?: string;
}): ProvedorIA | null {
  if (!config.LLM_PROVEDOR || !config.LLM_MODELO) return null;
  if (config.LLM_PROVEDOR === 'anthropic') {
    if (!config.LLM_API_KEY) return null;
    return comRetentativas(provedorAnthropic({ chave: config.LLM_API_KEY, modelo: config.LLM_MODELO, urlBase: config.LLM_URL_BASE }));
  }
  // Compatível com OpenAI: a chave é opcional (o Ollama local não usa)
  return comRetentativas(
    provedorCompativelOpenAI({ chave: config.LLM_API_KEY, modelo: config.LLM_MODELO, urlBase: config.LLM_URL_BASE }),
  );
}
