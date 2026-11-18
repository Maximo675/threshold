/**
 * Contexto de áudio compartilhado pelos sons do Threshold (máquina de escrever e telefone da Hotline).
 * Tudo é sintetizado com a Web Audio API: nenhum arquivo de áudio, nenhum asset de terceiros.
 *
 * Navegadores só liberam áudio depois de um gesto da pessoa (clique ou tecla). Por isso:
 * - `prepararSom()` deve ser chamado dentro de um gesto;
 * - quem toca chama `obterAudio()`, que devolve null enquanto o navegador não liberou.
 */

const VOLUME = 0.35;

let contexto: AudioContext | null = null;
let saida: GainNode | null = null;

function criar(): AudioContext | null {
  const Construtor =
    typeof window !== 'undefined'
      ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!Construtor) return null;
  const ctx = new Construtor();
  saida = ctx.createGain();
  saida.gain.value = VOLUME;
  saida.connect(ctx.destination);
  return ctx;
}

/** Chame dentro de um gesto da pessoa. Seguro em navegadores sem Web Audio. Devolve se o áudio está liberado. */
export function prepararSom(): boolean {
  try {
    contexto ??= criar();
    if (contexto?.state === 'suspended') void contexto.resume();
    return contexto !== null;
  } catch {
    contexto = null; // sem áudio: tudo continua funcionando, só em silêncio
    return false;
  }
}

/** O contexto pronto para tocar agora, ou null (sem Web Audio ou ainda bloqueado pelo navegador). */
export function obterAudio(): { ctx: AudioContext; saida: GainNode } | null {
  return contexto && saida && contexto.state === 'running' ? { ctx: contexto, saida } : null;
}

/** Só para testes: volta ao estado inicial. */
export function _reiniciarContexto(): void {
  contexto = null;
  saida = null;
}
