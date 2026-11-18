/**
 * Som da máquina de escrever da Lantern, sintetizado na hora com a Web Audio API (contexto em ./contexto.ts).
 * Sem arquivos de áudio: nada de assets de terceiros, nada para baixar, e o volume é baixo.
 *
 * Regras:
 * - Navegadores só liberam áudio depois de um gesto da pessoa. Por isso `prepararSom()` é chamado
 *   no clique/Enter de "Enviar"; a resposta chega depois e já pode tocar.
 * - O som acompanha a animação: com "reduzir movimento" não há animação e, portanto, não há som.
 * - Cada som dura menos de 3 segundos (WCAG 1.4.2) e há um botão para desligar, lembrado no navegador.
 */

import { _reiniciarContexto, obterAudio } from './contexto';

export { prepararSom } from './contexto';

let ruido: AudioBuffer | null = null;
let ruidoDe: AudioContext | null = null;
let ultimaTecla = 0;

const INTERVALO_MINIMO_MS = 55; // ~18 teclas por segundo: soa como alguém digitando rápido, não como metralhadora

/** 40 ms de ruído branco, criado uma vez por contexto e reaproveitado em toda tecla. */
function ruidoBranco(ctx: AudioContext): AudioBuffer {
  if (!ruido || ruidoDe !== ctx) {
    ruido = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.04), ctx.sampleRate);
    const dados = ruido.getChannelData(0);
    for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
    ruidoDe = ctx;
  }
  return ruido;
}

/** Uma batida de tecla. `caractere` muda o timbre: espaço é mais grave, quebra de linha soa como o carro voltando. */
export function tocarTecla(caractere = 'a'): void {
  const audio = obterAudio();
  if (!audio) return;
  const { ctx, saida } = audio;
  const agora = performance.now();
  if (agora - ultimaTecla < INTERVALO_MINIMO_MS) return;
  ultimaTecla = agora;

  const t = ctx.currentTime;
  const espaco = caractere === ' ';
  const linha = caractere === '\n';

  // "Clique" metálico: ruído filtrado com ataque instantâneo e queda rápida
  const fonte = ctx.createBufferSource();
  fonte.buffer = ruidoBranco(ctx);
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = (espaco ? 900 : 2200) + Math.random() * 900;
  filtro.Q.value = 1.2;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(espaco ? 0.5 : 0.8, t);
  envelope.gain.exponentialRampToValueAtTime(0.001, t + (linha ? 0.09 : 0.035));
  fonte.connect(filtro).connect(envelope).connect(saida);
  fonte.start(t);
  fonte.stop(t + 0.1);

  // "Baque" grave da haste batendo no papel
  const baque = ctx.createOscillator();
  baque.frequency.value = (linha ? 70 : 110) + Math.random() * 30;
  const ganhoBaque = ctx.createGain();
  ganhoBaque.gain.setValueAtTime(0.35, t);
  ganhoBaque.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  baque.connect(ganhoBaque).connect(saida);
  baque.start(t);
  baque.stop(t + 0.05);
}

/** O "ding" do fim da linha, quando a resposta termina. Menos de 1,5 s. */
export function tocarSino(): void {
  const audio = obterAudio();
  if (!audio) return;
  const { ctx, saida } = audio;
  const t = ctx.currentTime;
  for (const [freq, volume] of [
    [1760, 0.22],
    [2637, 0.1],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const ganho = ctx.createGain();
    ganho.gain.setValueAtTime(volume, t);
    ganho.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.connect(ganho).connect(saida);
    osc.start(t);
    osc.stop(t + 1.3);
  }
}

/** Só para testes: volta ao estado inicial. */
export function _reiniciarSom(): void {
  _reiniciarContexto();
  ruido = null;
  ruidoDe = null;
  ultimaTecla = 0;
}
