import { afterEach, describe, expect, it, vi } from 'vitest';
import { _reiniciarSom, prepararSom, tocarSino, tocarTecla } from './somMaquina';

/** AudioContext de mentira: só conta o que foi criado (o jsdom não tem Web Audio). */
function audioFalso(estado: AudioContextState = 'running') {
  const criados = { fontes: 0, osciladores: 0, resume: 0 };
  const no = () => ({ connect: (x: unknown) => x, gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } });
  class Falso {
    state = estado;
    currentTime = 0;
    sampleRate = 8000;
    destination = {};
    resume() {
      criados.resume++;
      this.state = 'running';
      return Promise.resolve();
    }
    createGain() {
      return no();
    }
    createBuffer(_c: number, n: number) {
      return { getChannelData: () => new Float32Array(n) };
    }
    createBufferSource() {
      criados.fontes++;
      return { ...no(), buffer: null, start: vi.fn(), stop: vi.fn() };
    }
    createBiquadFilter() {
      return { ...no(), type: '', frequency: { value: 0 }, Q: { value: 0 } };
    }
    createOscillator() {
      criados.osciladores++;
      return { ...no(), type: '', frequency: { value: 0 }, start: vi.fn(), stop: vi.fn() };
    }
  }
  vi.stubGlobal('AudioContext', Falso);
  return criados;
}

afterEach(() => {
  vi.unstubAllGlobals();
  _reiniciarSom();
});

describe('Som da máquina de escrever', () => {
  it('sem Web Audio no navegador, nada quebra e nada toca', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => {
      prepararSom();
      tocarTecla('a');
      tocarSino();
    }).not.toThrow();
  });

  it('não toca antes do gesto da pessoa (prepararSom)', () => {
    const criados = audioFalso();
    tocarTecla('a');
    expect(criados.fontes).toBe(0);
  });

  it('depois do gesto, cada tecla vira um clique + um baque, com intervalo mínimo entre teclas', () => {
    const criados = audioFalso();
    prepararSom();
    tocarTecla('a');
    tocarTecla('b'); // logo em seguida: ignorada (sem efeito metralhadora)
    expect(criados.fontes).toBe(1);
    expect(criados.osciladores).toBe(1);
  });

  it('retoma o áudio suspenso pelo navegador e toca o "ding" com duas notas', () => {
    const criados = audioFalso('suspended');
    prepararSom();
    expect(criados.resume).toBe(1);
    tocarSino();
    expect(criados.osciladores).toBe(2);
  });
});
