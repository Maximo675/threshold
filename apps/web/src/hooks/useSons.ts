import { useCallback, useSyncExternalStore } from 'react';

/**
 * Preferência única "Sons do Threshold" (máquina de escrever e telefone da Hotline).
 * Ligada por padrão, lembrada neste navegador e sincronizada entre os componentes da página.
 * Só guarda "ligado/desligado" — nenhum dado pessoal.
 */

const CHAVE = 'threshold:sons';
const CHAVE_ANTIGA = 'threshold:som-maquina'; // v0.5: respeita quem já tinha desligado o som da máquina
const EVENTO = 'threshold:sons-mudou';

function ler(): boolean {
  try {
    const valor = localStorage.getItem(CHAVE) ?? localStorage.getItem(CHAVE_ANTIGA);
    return valor !== 'desligado';
  } catch {
    return true; // navegação privada sem storage: vale o padrão
  }
}

let atual: boolean | null = null;

function obter(): boolean {
  atual ??= ler();
  return atual;
}

function assinar(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  return () => window.removeEventListener(EVENTO, aviso);
}

export function definirSons(ligado: boolean) {
  atual = ligado;
  try {
    localStorage.setItem(CHAVE, ligado ? 'ligado' : 'desligado');
  } catch {
    /* sem storage: vale só nesta visita */
  }
  window.dispatchEvent(new Event(EVENTO));
}

export function useSons(): [boolean, () => void] {
  const ligado = useSyncExternalStore(assinar, obter, () => true);
  const alternar = useCallback(() => definirSons(!obter()), []);
  return [ligado, alternar];
}

/** Só para testes. */
export function _reiniciarSons() {
  atual = null;
}
