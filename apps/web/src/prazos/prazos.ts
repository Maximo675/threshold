/**
 * Prazos do TCC e a regra de quando a Hotline "liga".
 * Funções puras (recebem `hoje`), para testar sem depender do relógio.
 */

export interface Prazo {
  id: string;
  titulo: string;
  /** Data no formato AAAA-MM-DD (dia inteiro, horário local). */
  data: string;
  /** Etapa do dossiê a que o prazo pertence. */
  etapa: number;
  /** Já resolvido (etapa aprovada ou pedido enviado): não gera ligação nem alerta. */
  concluido?: boolean;
}

export type Urgencia = 'vencido' | 'hoje' | 'urgente' | 'proximo' | 'tranquilo';

/** A Hotline liga quando algum prazo está a 14 dias ou menos (ou venceu e ainda não foi resolvido). */
export const JANELA_DE_AVISO_DIAS = 14;
const URGENTE_DIAS = 7;

function meiaNoite(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function paraData(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Dias inteiros de hoje até a data (0 = hoje, negativo = já passou). Imune a horário de verão. */
export function diasAte(iso: string, hoje: Date): number {
  return Math.round((meiaNoite(paraData(iso)) - meiaNoite(hoje)) / 86_400_000);
}

export function urgencia(dias: number): Urgencia {
  if (dias < 0) return 'vencido';
  if (dias === 0) return 'hoje';
  if (dias <= URGENTE_DIAS) return 'urgente';
  if (dias <= JANELA_DE_AVISO_DIAS) return 'proximo';
  return 'tranquilo';
}

/** "faltam 11 dias", "falta 1 dia", "é hoje", "venceu há 2 dias". */
export function textoDias(dias: number): string {
  if (dias === 0) return 'é hoje';
  if (dias === 1) return 'falta 1 dia';
  if (dias > 1) return `faltam ${dias} dias`;
  return dias === -1 ? 'venceu ontem' : `venceu há ${-dias} dias`;
}

/** "30/10" ou "30/10/2026". */
export function dataCurta(iso: string, comAno = false): string {
  const [a, m, d] = iso.split('-');
  return comAno ? `${d}/${m}/${a}` : `${d}/${m}`;
}

export interface PrazoCalculado extends Prazo {
  dias: number;
  urgencia: Urgencia;
}

export function calcularPrazos(prazos: Prazo[], hoje: Date): PrazoCalculado[] {
  return prazos
    .map((p) => {
      const dias = diasAte(p.data, hoje);
      return { ...p, dias, urgencia: urgencia(dias) };
    })
    .sort((a, b) => a.dias - b.dias);
}

/** Prazos que fazem a Hotline ligar hoje (vencidos há até 7 dias também, para não sumirem sem aviso). */
export function prazosParaLigar(prazos: Prazo[], hoje: Date): PrazoCalculado[] {
  return calcularPrazos(prazos, hoje).filter((p) => !p.concluido && p.dias <= JANELA_DE_AVISO_DIAS && p.dias >= -7);
}

/** AAAA-MM-DD de hoje no horário local (chave do "já atendeu hoje"). */
export function chaveDoDia(hoje: Date): string {
  const m = String(hoje.getMonth() + 1).padStart(2, '0');
  const d = String(hoje.getDate()).padStart(2, '0');
  return `${hoje.getFullYear()}-${m}-${d}`;
}
