import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { cancelarPedido, mensagemDeErro, obterDossie, obterOrientadores, pedirOrientacao, type Dossie } from '../api/threshold';
import { Botao } from '../components/Botao';
import { Cabecalho } from '../components/Cabecalho';
import { Carimbo } from '../components/Carimbo';
import { Chip } from '../components/Chip';
import { Desclassificar } from '../components/Desclassificar';
import { EstadoDaTela } from '../components/EstadoDaTela';
import { useRecurso } from '../hooks/useRecurso';
import { EmConstrucao } from './EmConstrucao';

const PERGUNTA_AO_BOARD = 'Que orientador combina com o meu tema?';

/**
 * Tela 4 — Ficha do orientador (perfil de afinidade).
 * Regras do produto: sem ranking nem nota; destaques só agregados e anônimos; a ordem é por afinidade com o tema.
 * "Solicitar orientação" grava o pedido no servidor: ele aparece no painel do professor e no dossiê da aluna.
 */
export function Orientadores() {
  const { id } = useParams();
  const buscar = useCallback(() => Promise.all([obterOrientadores(), obterDossie()]).then(([orientadores, dossie]) => ({ orientadores, dossie })), []);
  const { dados, erro, recarregar, definir } = useRecurso(buscar, 4000);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const idAnterior = useRef(id);

  // Ao trocar de ficha pelos links ao lado, o foco vai para o nome do novo professor
  // (no celular, isso também leva a tela de volta para o topo da ficha).
  useEffect(() => {
    if (idAnterior.current !== id) titulo.current?.focus();
    idAnterior.current = id;
  }, [id]);

  if (!dados) {
    return (
      <div className="page" data-setor="05">
        <div className="page__inner">
          <Cabecalho />
          <EstadoDaTela titulo="Orientadores" erro={erro} aoTentarDeNovo={recarregar} />
        </div>
      </div>
    );
  }

  const { orientadores, dossie } = dados;
  const orientador = id ? orientadores.find((o) => o.id === id) : orientadores[0];
  if (!orientador) return <EmConstrucao titulo="Ficha não encontrada" />;

  const outros = orientadores.filter((o) => o.id !== orientador.id);
  const { abertas, total } = orientador.vagas;
  const pedidoPendente = dossie.pedido?.estado === 'pendente' ? dossie.pedido : null;
  const ehMeuOrientador = dossie.orientador?.id === orientador.id;
  const pedidoAqui = pedidoPendente?.orientadorId === orientador.id;

  async function agir(acao: () => Promise<Dossie>) {
    setOcupado(true);
    setAviso(null);
    try {
      const novoDossie = await acao();
      definir({ orientadores: await obterOrientadores(), dossie: novoDossie });
    } catch (e) {
      setAviso(mensagemDeErro(e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="page" data-setor="05">
      <div className="page__inner">
        <Cabecalho usuario={dossie.aluna} />

        <div className="row g-4 align-items-start">
          <main className="col-lg-8 coluna-principal">
            <article className="card ficha" aria-labelledby="titulo-ficha">
              <div className="ficha__topo">
                <div className="stack" style={{ gap: 8 }}>
                  <p className="label">Ficha do orientador · arq. {orientador.protocolo}</p>
                  <h1 id="titulo-ficha" className="display display--l" ref={titulo} tabIndex={-1}>
                    <Desclassificar atraso={150}>{orientador.nome}</Desclassificar>
                  </h1>
                  <p className="muted" style={{ margin: 0 }}>
                    {orientador.curso} · perfil preenchido pelo próprio professor
                  </p>
                </div>
                <Carimbo tom="andamento" atraso={700}>
                  {`Afinidade ${orientador.afinidade}`}
                </Carimbo>
              </div>

              <section className="ficha__secao" aria-labelledby="titulo-areas">
                <h2 id="titulo-areas" className="label">
                  Áreas de pesquisa
                </h2>
                <ul className="chips">
                  {orientador.areas.map((area) => (
                    <li key={area}>
                      <Chip variante={area === orientador.areaEmDestaque ? 'destaque' : 'contorno'}>{area}</Chip>
                      {area === orientador.areaEmDestaque && <span className="visually-hidden"> (combina com o seu tema)</span>}
                    </li>
                  ))}
                </ul>
                <p className="soft" style={{ fontSize: 14 }}>
                  Em destaque: a área que combina com o tema do seu dossiê.
                </p>
              </section>

              <div className="ficha__grade">
                <section className="ficha__secao" aria-labelledby="titulo-estilo">
                  <h2 id="titulo-estilo" className="label">
                    Estilo de orientação
                  </h2>
                  {orientador.estilo.map((linha) => (
                    <p key={linha}>{linha}</p>
                  ))}
                </section>
                <section className="ficha__secao" aria-labelledby="titulo-vagas">
                  <h2 id="titulo-vagas" className="label">
                    Vagas neste semestre
                  </h2>
                  <div className="vagas" aria-hidden="true">
                    {Array.from({ length: total }, (_, i) => (
                      <span key={i} className={`vagas__vaga${i >= total - abertas ? ' vagas__vaga--aberta' : ''}`} />
                    ))}
                  </div>
                  <p>
                    <strong>
                      {abertas} {abertas === 1 ? 'vaga aberta' : 'vagas abertas'}
                    </strong>{' '}
                    de {total}
                  </p>
                </section>
              </div>

              <hr />

              <section className="ficha__secao" aria-labelledby="titulo-destaques">
                <h2 id="titulo-destaques" className="label">
                  O que ex-orientandos destacam
                </h2>
                <ul className="chips">
                  {orientador.destaques.map((d) => (
                    <li key={d}>
                      <Chip>{d}</Chip>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="ficha__secao" aria-labelledby="titulo-bom-saber">
                <h2 id="titulo-bom-saber" className="label">
                  Bom saber antes
                </h2>
                <p>{orientador.bomSaber}</p>
                <p className="muted" style={{ fontSize: 14 }}>
                  Resumo anônimo e moderado, exibido só depois de 5 avaliações. Nenhuma avaliação individual aparece.
                </p>
              </section>

              <div className="linha">
                {ehMeuOrientador ? (
                  <Carimbo tom="aprovado" atraso={0}>
                    Seu orientador
                  </Carimbo>
                ) : pedidoAqui ? (
                  <Botao variante="secundario" disabled={ocupado} onClick={() => void agir(cancelarPedido)}>
                    Cancelar o pedido
                  </Botao>
                ) : (
                  <Botao
                    disabled={ocupado || !!dossie.orientador || !!pedidoPendente || abertas === 0}
                    onClick={() => void agir(() => pedirOrientacao(orientador.id))}
                  >
                    Solicitar orientação
                  </Botao>
                )}
                <Botao para="/dossie" variante="secundario">
                  Voltar ao dossiê
                </Botao>
              </div>
              {/* Região sempre presente: leitores de tela anunciam o texto quando ele aparece, e o foco fica no botão */}
              <output className="saida-acao">
                {aviso && <span className="erro">{aviso}</span>}
                {!aviso && pedidoAqui && (
                  <span className="aviso">
                    <Carimbo tom="andamento" atraso={0}>
                      Pedido enviado
                    </Carimbo>{' '}
                    {orientador.nome} recebeu o seu pedido. A resposta aparece no seu dossiê.{' '}
                    <Link to={`/painel/${orientador.id}`}>Ver como orientador (demo)</Link>
                  </span>
                )}
                {!aviso && !pedidoAqui && pedidoPendente && (
                  <span className="muted">Você já tem um pedido aguardando resposta de {pedidoPendente.orientadorNome}.</span>
                )}
                {!aviso && !ehMeuOrientador && dossie.orientador && (
                  <span className="muted">Você já é orientanda de {dossie.orientador.nome}.</span>
                )}
                {!aviso && abertas === 0 && !ehMeuOrientador && <span className="muted">Sem vagas abertas neste semestre.</span>}
              </output>
            </article>
          </main>

          <aside className="col-lg-4 coluna-lateral" aria-label="Afinidade e outras fichas">
            <section className="card card--lantern lantern-brilho" aria-labelledby="titulo-por-que">
              <h2 id="titulo-por-que" className="label label--lantern">
                Lantern · por que ele aparece
              </h2>
              <p className="soft" style={{ margin: 0 }}>
                {orientador.porQue}
              </p>
              <Link to={`/lantern?pergunta=${encodeURIComponent(PERGUNTA_AO_BOARD)}`} className="accent">
                Perguntar ao Board, o conselheiro de orientação →
              </Link>
            </section>

            <section className="stack" aria-labelledby="titulo-outras">
              <h2 id="titulo-outras" className="label">
                Outras fichas compatíveis
              </h2>
              {/* Lista do Bootstrap (list-group): cada ficha é um link que ocupa a linha inteira */}
              <div className="list-group">
                {outros.map((o) => (
                  <Link key={o.id} to={`/orientadores/${o.id}`} className="list-group-item list-group-item-action outra-ficha">
                    <span className="outra-ficha__nome">{o.nome}</span>
                    <span className="outra-ficha__detalhe">
                      {o.areas[0]} · {o.vagas.abertas} {o.vagas.abertas === 1 ? 'vaga aberta' : 'vagas abertas'}
                    </span>
                  </Link>
                ))}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                Não existe ranking de professores. As fichas aparecem pela afinidade com o seu tema.
              </p>
            </section>
          </aside>
        </div>

        <footer className="rodape">PROTÓTIPO · DADOS FICTÍCIOS · PROFESSORES INVENTADOS</footer>
      </div>
    </div>
  );
}
