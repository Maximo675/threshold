import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { simularApi } from '../test/apiFalsa';
import { ordenarReferencias, paraHtml, separarReferencias } from '../util/copiar';
import { Referencias } from './Referencias';

const abrir = () =>
  render(
    <MemoryRouter initialEntries={['/referencias']}>
      <Referencias />
    </MemoryRouter>,
  );

const REVISAO = {
  itens: [
    { n: 1, original: 'souza, marina. Métodos. 2 ed. Curitiba: Editora Exemplo, 2021.', situacao: 'corrigir', problemas: [{ regra: 'REF-AUTOR-01', titulo: 'Sobrenome do autor em maiúsculas, prenome depois', explicacao: 'O sobrenome vai em maiúsculas.' }], corrigida: 'SOUZA, Marina. **Métodos**. 2. ed. Curitiba: Editora Exemplo, 2021.' },
    { n: 2, original: 'LIMA, Ana. **Guia**. São Paulo: Editora Exemplo, 2019.', situacao: 'ok', problemas: [], corrigida: 'LIMA, Ana. **Guia**. São Paulo: Editora Exemplo, 2019.' },
  ],
  resumo: { total: 2, aprovadas: 1, corrigir: 1, semResposta: 0 },
  protecao: { substituicoes: 0 },
};
const STATUS = { 'GET /api/lantern/status': { corpo: { online: true } } };

afterEach(() => vi.unstubAllGlobals());

describe('Utilidades de referência', () => {
  it('separa por linha, ou por linha em branco quando a referência foi quebrada em várias linhas', () => {
    expect(separarReferencias('SILVA, João. Título um. 2020.\n\ncurta\nLIMA, Ana. Título dois. 2021.')).toEqual(['SILVA, João. Título um. 2020.', 'curta LIMA, Ana. Título dois. 2021.']);
    expect(separarReferencias('SILVA, João. Título um. 2020.\nLIMA, Ana. Título dois. 2021.\n   \n')).toHaveLength(2);
    expect(separarReferencias('  ')).toEqual([]);
  });

  it('ordena como a ABNT pede, ignorando destaque e acento', () => {
    expect(ordenarReferencias(['SOUZA, M. **B**.', '**GUIA** prático.', 'ÁVILA, C. **A**.'])).toEqual(['ÁVILA, C. **A**.', '**GUIA** prático.', 'SOUZA, M. **B**.']);
  });

  it('o HTML copiado tem negrito e nunca interpreta marcação vinda do texto', () => {
    expect(paraHtml(['A <script>x</script> **Título** & fim.'])).toBe('<p>A &lt;script&gt;x&lt;/script&gt; <b>Título</b> &amp; fim.</p>');
  });
});

describe('Tela Referências', () => {
  it('conta as referências coladas e trava o envio acima do limite', async () => {
    simularApi(STATUS);
    abrir();
    const campo = screen.getByLabelText('Referências, uma por linha');
    await userEvent.click(screen.getByRole('button', { name: 'Usar a lista de exemplo' }));
    expect(screen.getByText('4 referências encontradas · até 12 por vez')).toBeInTheDocument();
    await userEvent.clear(campo);
    await userEvent.click(campo);
    await userEvent.paste(Array.from({ length: 13 }, (_, i) => `SILVA, João. Título número ${i}. 2020.`).join('\n'));
    expect(screen.getByText(/13 referências: o limite é 12/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revisar com o Archivist' })).toBeDisabled();
  });

  it('revisa a lista e mostra cada referência carimbada, com a regra e como fica', async () => {
    const chamadas = simularApi({ ...STATUS, 'POST /api/referencias/revisar': { corpo: REVISAO } });
    abrir();
    await userEvent.click(screen.getByLabelText('Referências, uma por linha'));
    await userEvent.paste(REVISAO.itens.map((i) => i.original).join('\n'));
    await userEvent.click(await screen.findByRole('button', { name: 'Revisar com o Archivist' }));
    const titulo = await screen.findByRole('heading', { name: 'Resultado: 1 aprovada · 1 para corrigir' });
    expect(titulo).toHaveFocus();
    const [primeira, segunda] = screen.getAllByRole('listitem').filter((li) => li.classList.contains('revisada'));
    expect(within(primeira!).getByText('Corrigir')).toBeInTheDocument();
    expect(within(primeira!).getByText('REF-AUTOR-01')).toBeInTheDocument();
    expect(within(primeira!).getByText('Como fica').parentElement!.querySelector('strong')).toHaveTextContent('Métodos');
    expect(within(segunda!).getByText('Aprovada')).toBeInTheDocument();
    expect(chamadas.find((c) => c.chave.endsWith('/revisar'))?.corpo).toEqual({ referencias: REVISAO.itens.map((i) => i.original) });
  });

  it('copia a lista corrigida em ordem alfabética e confirma', async () => {
    simularApi({ ...STATUS, 'POST /api/referencias/revisar': { corpo: REVISAO } });
    const escrever = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: escrever }, configurable: true });
    abrir();
    await userEvent.click(screen.getByLabelText('Referências, uma por linha'));
    await userEvent.paste(REVISAO.itens.map((i) => i.original).join('\n'));
    await userEvent.click(await screen.findByRole('button', { name: 'Revisar com o Archivist' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Copiar a lista corrigida, em ordem alfabética' }));
    expect(await screen.findByText(/Lista copiada em ordem alfabética/)).toBeInTheDocument();
    expect(escrever.mock.calls[0]![0]).toBe('LIMA, Ana. Guia. São Paulo: Editora Exemplo, 2019.\n\nSOUZA, Marina. Métodos. 2. ed. Curitiba: Editora Exemplo, 2021.');
  });

  it('monta a referência pelo DOI, mostra a fonte e os avisos, e adiciona à lista', async () => {
    const montada = { referencia: 'BARROS, Júlia. Leitura em telas. **Revista Exemplo**, [S. l.], maio 2025. DOI: 10.99999/x.', tipo: 'artigo', avisos: ['A base não informa a cidade de publicação: usei [S. l.].'], fonte: 'Crossref', identificador: '10.99999/x' };
    const chamadas = simularApi({ ...STATUS, 'GET /api/referencias/doi?doi=10.99999%2Fx': { corpo: montada } });
    abrir();
    await userEvent.type(screen.getByLabelText('DOI do artigo'), '10.99999/x');
    await userEvent.click(screen.getByRole('button', { name: 'Montar a referência' }));
    expect(await screen.findByText('Montada com dados da Crossref')).toBeInTheDocument();
    expect(screen.getByText('A base não informa a cidade de publicação: usei [S. l.].')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar à lista' }));
    expect(screen.getByLabelText('Referências, uma por linha')).toHaveValue(montada.referencia);
    expect(chamadas.some((c) => c.chave.startsWith('GET /api/referencias/doi'))).toBe(true);
  });

  it('troca para ISBN e mostra o erro da busca sem perder a lista', async () => {
    simularApi({ ...STATUS, 'GET /api/referencias/isbn?isbn=123': { status: 400, corpo: { erro: 'ISBN inválido. Ele tem 10 ou 13 dígitos e fica perto do código de barras do livro.' } } });
    abrir();
    await userEvent.click(screen.getByRole('radio', { name: 'ISBN (livro)' }));
    await userEvent.type(screen.getByLabelText('ISBN do livro'), '123');
    await userEvent.click(screen.getByRole('button', { name: 'Montar a referência' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ISBN inválido');
  });

  it('com a IA desligada, avisa que a revisão está offline mas a busca continua disponível', async () => {
    simularApi({ 'GET /api/lantern/status': { corpo: { online: false } } });
    abrir();
    expect(await screen.findByText('O Archivist está offline.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Montar a referência' })).toBeInTheDocument();
  });
});
