/**
 * Copia texto com o destaque da ABNT. O texto usa **asteriscos** para marcar o negrito (como a Lantern).
 * Para o Word e o Google Docs vai uma versão em HTML com <b>; para editores simples, o texto puro sem asteriscos.
 * Devolve false se o navegador não deixar copiar (a tela então pede para selecionar e copiar à mão).
 */
const escapar = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const semDestaque = (texto: string) => texto.replace(/\*\*(.+?)\*\*/g, '$1');

export function paraHtml(paragrafos: string[]): string {
  return paragrafos.map((p) => `<p>${escapar(p).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>`).join('');
}

export async function copiarComDestaque(paragrafos: string[]): Promise<boolean> {
  const puro = paragrafos.map(semDestaque).join('\n\n');
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([paraHtml(paragrafos)], { type: 'text/html' }),
          'text/plain': new Blob([puro], { type: 'text/plain' }),
        }),
      ]);
      return true;
    }
    await navigator.clipboard.writeText(puro);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(puro);
      return true;
    } catch {
      return false;
    }
  }
}

/** Separa o que foi colado em referências: por linha em branco, se houver; senão, uma por linha. */
export function separarReferencias(texto: string): string[] {
  const blocos = /\n\s*\n/.test(texto.trim()) ? texto.split(/\n\s*\n/) : texto.split('\n');
  return blocos.map((b) => b.replace(/\s+/g, ' ').trim()).filter((b) => b.length >= 10);
}

/** Ordem alfabética, como a NBR 6023 pede na lista de referências (ignora o destaque e os acentos). */
export function ordenarReferencias(referencias: string[]): string[] {
  return [...referencias].sort((a, b) => semDestaque(a).localeCompare(semDestaque(b), 'pt-BR', { sensitivity: 'base' }));
}
