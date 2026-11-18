import { prepararSom } from '../audio/contexto';

/** Evento que faz a Hotline ligar na hora (usado pelo botão de demonstração do dossiê). */
export const EVENTO_LIGAR = 'threshold:hotline-ligar';

/** Pede uma ligação da Hotline. Chamar num clique: o gesto é o que libera o áudio no navegador. */
export function ligarHotline() {
  prepararSom();
  window.dispatchEvent(new Event(EVENTO_LIGAR));
}
