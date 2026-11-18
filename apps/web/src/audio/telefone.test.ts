import { afterEach, describe, expect, it, vi } from 'vitest';
import { _reiniciarContexto, prepararSom } from './contexto';
import { tocarTelefone } from './telefone';

function audioFalso() {
  const registro = { osciladores: 0, paradosCedo: 0 };
  const parametro = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), cancelScheduledValues: vi.fn() });
  class Falso {
    state = 'running';
    currentTime = 10;
    destination = {};
    resume() {
      return Promise.resolve();
    }
    createGain() {
      return { connect: (x: unknown) => x, gain: parametro() };
    }
    createOscillator() {
      registro.osciladores++;
      return {
        connect: (x: unknown) => x,
        type: '',
        frequency: { value: 0 },
        start: vi.fn(),
        stop: vi.fn((t: number) => {
          if (t < 10.2) registro.paradosCedo++;
        }),
      };
    }
  }
  vi.stubGlobal('AudioContext', Falso);
  return registro;
}

afterEach(() => {
  vi.unstubAllGlobals();
  _reiniciarContexto();
});

describe('Toque do telefone da Hotline', () => {
  it('sem áudio liberado, não toca e devolve um "parar" que não quebra', () => {
    const r = audioFalso();
    const parar = tocarTelefone();
    expect(r.osciladores).toBe(0);
    expect(() => parar()).not.toThrow();
  });

  it('toca 2 toques de campainha (24 batidas × 3 parciais cada, por toque)', () => {
    const r = audioFalso();
    prepararSom();
    tocarTelefone();
    expect(r.osciladores).toBe(2 * 24 * 3);
  });

  it('"parar" corta todas as batidas agendadas na hora', () => {
    const r = audioFalso();
    prepararSom();
    const parar = tocarTelefone();
    parar();
    expect(r.paradosCedo).toBe(2 * 24 * 3);
  });
});
