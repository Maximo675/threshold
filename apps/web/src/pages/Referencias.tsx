import { useEffect, useRef, useState, type FormEvent } from 'react';
import { statusLantern } from '../api/lantern';
import { buscarPorDoi, buscarPorIsbn, mensagemDeErro, revisarReferencias, type ReferenciaMontada, type Revisao } from '../api/threshold';
import { Botao } from '../components/Botao';
import { Cabecalho } from '../components/Cabecalho';
import { Carimbo } from '../components/Carimbo';
import { Desclassificar } from '../components/Desclassificar';
import { TextoFormatado } from '../components/TextoFormatado';
import { copiarComDestaque, ordenarReferencias, semDestaque, separarReferencias } from '../util/copiar';

const MAXIMO = 12;

/** Referências inventadas, com erros comuns de propósito, para a demonstração. */
const EXEMPLO = [
  'souza, marina. Métodos de pesquisa em computação. 2 ed. Curitiba: Editora Exemplo, 2021.',
  'LIMA, Ana; COSTA, Bruno. Guia de redação técnica. São Paulo: Editora Exemplo Ltda., 2019',
  'BARROS, Júlia. Avaliação de acessibilidade em portais universitários. Revista Exemplo de Computação, Curitiba, v. 12, n. 3, p. 45-60, mar. 2024.',
  'NOGUEIRA, Paulo. **Testes de software**: guia para iniciantes. Curitiba: Editora Exemplo, 2023.',
].join('\n');

const SITUACAO = {
  ok: { tom: 'aprovado', texto: 'Aprovada' },
  corrigir: { tom: 'alerta', texto: 'Corrigir' },
  'sem-resposta': { tom: 'andamento', texto: 'Sem resposta' },
} as const;

/**
 * Tela — Referências (sala do Archivist).
 * 1. Revisão em lote: cola a lista inteira e cada referência volta carimbada, com a regra da NBR 6023 e a versão corrigida.
 * 2. Busca por DOI ou ISBN: o servidor consulta bases públicas (Crossref e BrasilAPI) e monta a referência no formato ABNT.
 * Corrigir a FORMA de uma referência não é escrever o TCC: aqui a IA pode entregar o texto pronto.
 */
export function Referencias() {
  const [lista, setLista] = useState('');
  const [online, setOnline] = useState<boolean | null>(null);
  const [revisando, setRevisando] = useState(false);
  const [revisao, setRevisao] = useState<Revisao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState('');
  const tituloResultado = useRef<HTMLHeadingElement>(null);

  const [tipoBusca, setTipoBusca] = useState<'doi' | 'isbn'>('doi');
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [achada, setAchada] = useState<ReferenciaMontada | null>(null);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  useEffect(() => {
    statusLantern().then((s) => setOnline(s.online));
  }, []);

  useEffect(() => {
    if (revisao) tituloResultado.current?.focus();
  }, [revisao]);

  const referencias = separarReferencias(lista);
  const demais = referencias.length > MAXIMO;

  async function aoRevisar(e: FormEvent) {
    e.preventDefault();
    if (referencias.length === 0 || demais || revisando) return;
    setErro(null);
    setCopiado('');
    setRevisando(true);
    setRevisao(null);
    try {
      setRevisao(await revisarReferencias(referencias));
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setRevisando(false);
    }
  }

  async function aoBuscar(e: FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || buscando) return;
    setErroBusca(null);
    setAchada(null);
    setBuscando(true);
    try {
      setAchada(await (tipoBusca === 'doi' ? buscarPorDoi(codigo.trim()) : buscarPorIsbn(codigo.trim())));
    } catch (falha) {
      setErroBusca(mensagemDeErro(falha));
    } finally {
      setBuscando(false);
    }
  }

  async function copiar(paragrafos: string[], confirmacao: string) {
    setCopiado((await copiarComDestaque(paragrafos)) ? confirmacao : 'Não deu para copiar automaticamente. Selecione o texto e copie.');
  }

  const corrigidas = revisao?.itens.filter((i) => i.situacao !== 'sem-resposta').map((i) => i.corrigida) ?? [];

  return (
    <div className="page" data-setor="03">
      <div className="page__inner">
        <Cabecalho />

        <section className="stack" aria-labelledby="titulo-referencias">
          <p className="label label--lantern">Archivist · sala de referências</p>
          <h1 id="titulo-referencias" className="display display--l">
            <Desclassificar atraso={150}>Referências sem mistério</Desclassificar>
          </h1>
          <p className="soft" style={{ margin: 0, maxWidth: 760 }}>
            Cole a sua lista e o Archivist carimba cada referência: aprovada ou para corrigir, com a regra da NBR 6023 e
            como fica. Não tem a referência pronta? Monte pelo DOI do artigo ou pelo ISBN do livro.
          </p>
        </section>

        <div className="row g-4 align-items-start">
          <main className="col-lg-8 coluna-principal">
            <form onSubmit={aoRevisar} className="formulario-conversa" aria-labelledby="titulo-lista">
              <h2 id="titulo-lista" className="label">
                Sua lista de referências
              </h2>
              <label htmlFor="lista" className="visually-hidden">
                Referências, uma por linha
              </label>
              <textarea
                id="lista"
                className="form-control"
                rows={8}
                value={lista}
                onChange={(e) => setLista(e.target.value)}
                placeholder="Uma referência por linha (ou separadas por uma linha em branco)"
                aria-describedby="dica-lista"
              />
              <span id="dica-lista" className={demais ? 'accent' : 'muted'} style={{ fontSize: 13 }}>
                {referencias.length === 0
                  ? `Até ${MAXIMO} referências por vez.`
                  : demais
                    ? `${referencias.length} referências: o limite é ${MAXIMO} por vez. Revise em partes.`
                    : `${referencias.length} ${referencias.length === 1 ? 'referência encontrada' : 'referências encontradas'} · até ${MAXIMO} por vez`}
              </span>
              <div className="linha">
                <button type="submit" className="btn btn-lantern botao" disabled={referencias.length === 0 || demais || revisando || online === false}>
                  {revisando ? 'O Archivist está conferindo…' : 'Revisar com o Archivist'}
                </button>
                <Botao variante="secundario" disabled={revisando} onClick={() => setLista(EXEMPLO)}>
                  Usar a lista de exemplo
                </Botao>
                {lista && (
                  <Botao
                    variante="secundario"
                    disabled={revisando}
                    onClick={() => {
                      setLista('');
                      setRevisao(null);
                      setErro(null);
                    }}
                  >
                    Limpar
                  </Botao>
                )}
              </div>
              {online === false && (
                <p className="aviso" style={{ margin: 0 }}>
                  <strong>O Archivist está offline.</strong> A revisão usa a IA: configure o provedor no <code>.env</code>. A busca
                  por DOI e ISBN funciona mesmo assim.
                </p>
              )}
            </form>

            {/* Região viva para leitores de tela acompanharem a revisão */}
            <output className="visually-hidden">{revisando ? 'O Archivist está conferindo a lista.' : ''}</output>
            {revisando && (
              <p className="estado-da-tela__carregando" aria-hidden="true">
                <span className="lampada-mini" />
                Conferindo cada referência com a base da NBR 6023… Pode levar até um minuto com a lista cheia.
              </p>
            )}

            {erro && (
              <p className="erro" role="alert">
                {erro}
              </p>
            )}

            {revisao && (
              <section className="stack" style={{ gap: 18 }} aria-labelledby="titulo-revisao">
                <h2 id="titulo-revisao" className="label label--lantern" ref={tituloResultado} tabIndex={-1}>
                  Resultado: {revisao.resumo.aprovadas} {revisao.resumo.aprovadas === 1 ? 'aprovada' : 'aprovadas'} ·{' '}
                  {revisao.resumo.corrigir} para corrigir
                  {revisao.resumo.semResposta > 0 && ` · ${revisao.resumo.semResposta} sem resposta`}
                </h2>
                <ol className="revisadas">
                  {revisao.itens.map((item, i) => (
                    <li key={item.n} className={`revisada revisada--${item.situacao}`}>
                      <div className="revisada__topo">
                        <span className="revisada__numero">REF. {String(item.n).padStart(2, '0')}</span>
                        <Carimbo tom={SITUACAO[item.situacao].tom} atraso={200 + i * 180}>
                          {SITUACAO[item.situacao].texto}
                        </Carimbo>
                      </div>
                      <p className="revisada__original">{semDestaque(item.original)}</p>
                      {item.situacao === 'sem-resposta' && (
                        <p className="muted" style={{ margin: 0 }}>
                          O Archivist não devolveu esta referência. Revise de novo só com ela.
                        </p>
                      )}
                      {item.problemas.length > 0 && (
                        <ul className="revisada__problemas">
                          {item.problemas.map((p, j) => (
                            <li key={j}>
                              {p.regra && (
                                <span className="revisada__regra" title={p.titulo ?? undefined}>
                                  {p.regra}
                                </span>
                              )}
                              <span>
                                {p.titulo && <strong>{p.titulo}. </strong>}
                                {p.explicacao}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.situacao === 'corrigir' && (
                        <div className="revisada__corrigida">
                          <span className="label">Como fica</span>
                          <p style={{ margin: 0 }}>
                            <TextoFormatado texto={item.corrigida} />
                          </p>
                          <button
                            type="button"
                            className="alternar-som"
                            aria-label={`Copiar a referência ${item.n} corrigida`}
                            onClick={() => void copiar([item.corrigida], `Referência ${item.n} copiada.`)}
                          >
                            Copiar
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
                <div className="linha">
                  <Botao onClick={() => void copiar(ordenarReferencias(corrigidas), 'Lista copiada em ordem alfabética, com o negrito. Cole no Word ou no Docs.')}>
                    Copiar a lista corrigida, em ordem alfabética
                  </Botao>
                </div>
                <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                  {revisao.protecao.substituicoes > 0 && `${revisao.protecao.substituicoes} trecho(s) com dado pessoal foram tarjados antes de ir para a IA. `}
                  Revisão feita por IA com base em um resumo da NBR 6023:2018: confira com o seu orientador.
                </p>
              </section>
            )}
            <output className="saida-acao">{copiado}</output>
          </main>

          <aside className="col-lg-4 coluna-lateral" aria-label="Montar referência">
            <section className="card" aria-labelledby="titulo-busca">
              <p className="label label--lantern">Sem IA · bases públicas</p>
              <h2 id="titulo-busca" style={{ fontSize: 18 }}>
                Montar pelo DOI ou ISBN
              </h2>
              <form className="formulario-conversa" onSubmit={aoBuscar}>
                {/* Grupo de botões do Bootstrap (btn-group + btn-check): continua sendo um par de rádios para o leitor de tela */}
                <fieldset className="opcoes">
                  <legend className="visually-hidden">Tipo de código</legend>
                  <div className="btn-group">
                    <input type="radio" className="btn-check" id="tipo-doi" name="tipo" checked={tipoBusca === 'doi'} onChange={() => setTipoBusca('doi')} />
                    <label className="btn btn-arquivo opcoes__item" htmlFor="tipo-doi">
                      DOI (artigo)
                    </label>
                    <input type="radio" className="btn-check" id="tipo-isbn" name="tipo" checked={tipoBusca === 'isbn'} onChange={() => setTipoBusca('isbn')} />
                    <label className="btn btn-arquivo opcoes__item" htmlFor="tipo-isbn">
                      ISBN (livro)
                    </label>
                  </div>
                </fieldset>
                <label htmlFor="codigo" className="form-label formulario-conversa__rotulo">
                  {tipoBusca === 'doi' ? 'DOI do artigo' : 'ISBN do livro'}
                </label>
                <input
                  id="codigo"
                  className="campo form-control"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder={tipoBusca === 'doi' ? '10.1145/3290605.3300233' : '978-85-457-0287-0'}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby="dica-codigo"
                />
                <span id="dica-codigo" className="muted" style={{ fontSize: 13 }}>
                  {tipoBusca === 'doi'
                    ? 'Fica na primeira página do artigo ou no endereço doi.org. Fonte: Crossref.'
                    : 'Fica perto do código de barras do livro. Fonte: BrasilAPI.'}
                </span>
                <div>
                  <button type="submit" className="btn btn-arquivo botao" disabled={!codigo.trim() || buscando}>
                    {buscando ? 'Consultando…' : 'Montar a referência'}
                  </button>
                </div>
              </form>

              {erroBusca && (
                <p className="erro" role="alert">
                  {erroBusca}
                </p>
              )}

              <output className="visually-hidden">{achada ? `Referência montada com dados da ${achada.fonte}.` : ''}</output>
              {achada && (
                <div className="stack">
                  <p className="label">Montada com dados da {achada.fonte}</p>
                  <p className="revisada__corrigida" style={{ margin: 0 }}>
                    <TextoFormatado texto={achada.referencia} />
                  </p>
                  {achada.avisos.length > 0 && (
                    <>
                      <p className="label">Confira antes de usar</p>
                      <ul className="avisos">
                        {achada.avisos.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  <div className="linha" style={{ gap: 10 }}>
                    <Botao
                      variante="secundario"
                      onClick={() => {
                        setLista((atual) => (atual.trim() ? `${atual.trim()}\n` : '') + achada.referencia);
                        setCopiado('Referência adicionada à lista.');
                      }}
                    >
                      Adicionar à lista
                    </Botao>
                    <Botao variante="secundario" onClick={() => void copiar([achada.referencia], 'Referência copiada, com o negrito.')}>
                      Copiar
                    </Botao>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>

        <footer className="rodape">DEMONSTRAÇÃO · REVISÃO GERADA POR IA E DADOS DE BASES PÚBLICAS: CONFIRA COM SEU ORIENTADOR</footer>
      </div>
    </div>
  );
}
