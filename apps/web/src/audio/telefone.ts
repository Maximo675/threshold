import { obterAudio } from './contexto';

/**
 * Toque de telefone antigo (campainha mecânica de duas sinetas), sintetizado — som original, sem assets de terceiros.
 *
 * Como um telefone de disco toca: um martelinho bate alternadamente em duas sinetas ~20 vezes por segundo
 * durante cerca de 1 segundo, e o toque se repete depois de uma pausa. Aqui: 2 toques (cerca de 3,5 s no total).
 *
 * WCAG 1.4.2: o toque passa de 3 s, então a chamada tem botão "Silenciar" e para sozinha ao atender.
 * Devolve uma função que interrompe o toque na hora.
 */

const SINETAS = [1150, 1340]; // Hz: duas sinetas levemente desafinadas entre si, como as de verdade
const PARCIAIS = [1, 2.76, 5.4]; // parciais inarmônicas de sino
const BATIDAS_POR_SEGUNDO = 22;
const DURACAO_TOQUE = 1.1; // s
const PAUSA = 1.3; // s

export function tocarTelefone(toques = 2): () => void {
  const audio = obterAudio();
  if (!audio) return () => {};
  const { ctx, saida } = audio;

  // Um volume só para esta chamada: "Silenciar" baixa ele a zero sem esperar as batidas agendadas
  const volume = ctx.createGain();
  volume.gain.value = 0.55;
  volume.connect(saida);

  const inicio = ctx.currentTime + 0.05;
  const osciladores: OscillatorNode[] = [];
  for (let toque = 0; toque < toques; toque++) {
    const t0 = inicio + toque * (DURACAO_TOQUE + PAUSA);
    const batidas = Math.round(DURACAO_TOQUE * BATIDAS_POR_SEGUNDO);
    for (let b = 0; b < batidas; b++) {
      const t = t0 + b / BATIDAS_POR_SEGUNDO;
      const base = SINETAS[b % 2];
      // cada batida soa um pouco e "vaza" na próxima, como metal vibrando
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.5, t + 0.004);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      env.connect(volume);
      PARCIAIS.forEach((p, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = base * p;
        const g = ctx.createGain();
        g.gain.value = [0.7, 0.25, 0.08][i];
        osc.connect(g).connect(env);
        osc.start(t);
        osc.stop(t + 0.16);
        osciladores.push(osc);
      });
    }
  }

  let parado = false;
  return () => {
    if (parado) return;
    parado = true;
    const t = ctx.currentTime;
    volume.gain.cancelScheduledValues(t);
    volume.gain.setValueAtTime(volume.gain.value, t);
    volume.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    for (const osc of osciladores) {
      try {
        osc.stop(t + 0.06);
      } catch {
        /* já tinha parado */
      }
    }
  };
}

/** Duração total do toque, para o visual tremer junto. */
export const DURACAO_TELEFONE_MS = Math.round((2 * DURACAO_TOQUE + PAUSA) * 1000);
