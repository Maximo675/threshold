import { z } from 'zod';

/**
 * Configuração da API, lida das variáveis de ambiente e validada na subida.
 * Se algo obrigatório faltar, a API NÃO sobe (falhar cedo é mais seguro que subir mal configurada).
 * Segredos nunca ficam no código: veja .env.example na raiz.
 */
/** Variável vazia no .env (ex.: "LLM_MODELO=") conta como não definida. */
const opcional = <T extends z.ZodType>(esquema: T) => z.preprocess((v) => (v === '' ? undefined : v), esquema.optional());

const Esquema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  /** Segredo do HMAC que gera os códigos de pseudônimo (ALUNO_xxxxxx). Mínimo de 32 caracteres. */
  PSEUDONIMO_SEGREDO: z.string().min(32, 'precisa ter pelo menos 32 caracteres'),
  /** Requisições por minuto por IP antes de responder 429. */
  LIMITE_REQUISICOES_POR_MINUTO: z.coerce.number().int().positive().default(60),
  /**
   * Pasta com o build do front (apps/web/dist). Se definida, a API também serve o site,
   * e a plataforma inteira roda num só endereço (é o que a imagem Docker faz).
   */
  WEB_DIST: opcional(z.string()),

  // ---- IA da Lantern (opcional: sem isso a Lantern aparece como offline) ----
  /** "anthropic" (Claude) ou "openai" (qualquer API compatível: OpenAI, Groq, Ollama local...). */
  LLM_PROVEDOR: opcional(z.enum(['anthropic', 'openai'])),
  /** Chave da API. Fica só no servidor. */
  LLM_API_KEY: opcional(z.string()),
  /** Modelo, exatamente como o provedor publica (ex.: claude-haiku-5-5). */
  LLM_MODELO: opcional(z.string()),
  /** Endereço base, para provedores compatíveis (ex.: http://host.docker.internal:11434/v1 para o Ollama). */
  LLM_URL_BASE: opcional(z.string().url()),
  /** Mensagens para a Lantern por minuto por IP (controla custo — OWASP LLM10). */
  LIMITE_LANTERN_POR_MINUTO: z.coerce.number().int().positive().default(20),
});

export type Config = z.infer<typeof Esquema>;

export function carregarConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const resultado = Esquema.safeParse(env);
  if (!resultado.success) {
    const problemas = resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuração inválida: ${problemas}`);
  }
  return resultado.data;
}
