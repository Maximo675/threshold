import { useCallback, useSyncExternalStore } from 'react';

/**
 * Preferência "Efeitos de luz" (a luz da Lantern que segue o cursor e os cartões que reagem).
 * Ligada por padrão, lembrada neste navegador. Só guarda "ligado/desligado" — nenhum dado pessoal.
 * Quem pede "reduzir movimento" no sistema já recebe tudo parado, com ou sem este botão.
 */
const CHAVE = 'threshold:efeitos';
const EVENTO = 'threshold:efeitos-mudou';

let atual: boolean | null = null;

function obter(): boolean {
  if (atual === null) {
    try {
      atual = localStorage.getItem(CHAVE) !== 'desligado';
    } catch {
      atual = true;
    }
  }
  return atual;
}

function assinar(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  return () => window.removeEventListener(EVENTO, aviso);
}

export function definirEfeitos(ligado: boolean) {
  atual = ligado;
  try {
    localStorage.setItem(CHAVE, ligado ? 'ligado' : 'desligado');
  } catch {
    /* sem storage: vale só nesta visita */
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function useEfeitos(): [boolean, () => void] {
  const ligado = useSyncExternalStore(assinar, obter, () => true);
  const alternar = useCallback(() => definirEfeitos(!obter()), []);
  return [ligado, alternar];
}

/** Só para testes. */
export function _reiniciarEfeitos() {
  atual = null;
}
