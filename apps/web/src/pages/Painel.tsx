import { useCallback, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import {
  enviarDevolutiva,
  enviarLembrete,
  mensagemDeErro,
  obterPainel,
  responderPedido,
  revisarEtapa,
  type Painel as DadosPainel,
} from '../api/threshold';
import { Botao } from '../components/Botao';
import { Cabecalho } from '../components/Cabecalho';
import { Carimbo } from '../components/Carimbo';
import { Confirmacao } from '../components/Confirmacao';
import { Desclassificar } from '../components/Desclassificar';
import { EstadoDaTela } from '../components/EstadoDaTela';
import { useRecurso } from '../hooks/useRecurso';

const PADRAO = 'ricardo-almeida';
const LIMITE = 600;

const SITUACAO: Record<DadosPainel['orientandos'][number]['situacao'], { tom: 'aprovado' | 'andamento' | 'alerta'; texto: string }> = {
  'em-dia': { tom: 'aprovado', texto: 'Em dia' },
  atrasado: { tom: 'alerta', texto: 'Atrasado' },
  'aguardando-revisao': { tom: 'andamento', texto: 'Aguarda você' },
};

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const hojeIso = () => new Date().toISOString().slice(0, 10);

/**
 * Tela — Painel do orientador. Nasceu das respostas dos professores: eles querem gastar menos tempo
 * explicando etapas e cobrando entregas. Aqui o professor aceita pedidos, vê quem está atrasado, pede
 * um lembrete à Hotline e manda a devolutiva, que aparece na hora no dossiê da aluna.
 */
export function Painel() {
  const { id = PADRAO } = useParams();
  const buscar = useCallback(() => obterPainel(id), [id]);
  const { dados, erro, recarregar, definir } = useRecurso(buscar, 4000);
  const [ocupado, setOcupado] = useState(false);
  const [recusar, setRecusar] = useState<{ id: number; nome: string } | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [texto, setTexto] = useState('');

  async function agir(acao: () => Promise<DadosPainel>, confirmacao: string) {
    setOcupado(true);
    setAviso(null);
    try {
      definir(await acao());
      setAviso({ tipo: 'ok', texto: confirmacao });
      return true;
    } catch (e) {
      setAviso({ tipo: 'erro', texto: mensagemDeErro(e) });
      return false;
    } finally {
      setOcupado(false);
    }
  }

  if (!dados || dados.orientador.id !== id) {
    return (
      <div className="page" data-setor="07">
        <div className="page__inner">
          <Cabecalho />
          <EstadoDaTela titulo="Painel do orientador" erro={erro} aoTentarDeNovo={recarregar} />
        </div>
      </div>
    );
  }

  const { orientador, resumo, pedidos, orientandos, devolutivas } = dados;
  const ana = orientandos.find((o) => o.interativo);
  const mensagem = texto.trim();

  async function aoEnviarDevolutiva(e: FormEvent) {
    e.preventDefault();
    if (mensagem.length < 3) return;
    if (await agir(() => enviarDevolutiva(id, mensagem), 'Devolutiva enviada. Ela já aparece no dossiê da aluna.')) setTexto('');
  }

  async function aoRevisar(decisao: 'aprovar' | 'devolver') {
    const ok = await agir(
      () => revisarEtapa(id, decisao, mensagem.length >= 3 ? mensagem : undefined),
      decisao === 'aprovar' ? 'Etapa aprovada. A próxima etapa foi liberada para a aluna.' : 'Etapa devolvida para ajustes, com a sua devolutiva.',
    );
    if (ok) setTexto('');
  }

  return (
    <div className="page" data-setor="07">
      <div className="page__inner">
        <Cabecalho usuario={{ nome: orientador.nome, detalhe: `Orientador · ${orientador.curso}` }} />

        <section className="stack" aria-labelledby="titulo-painel">
          <p className="label label--lantern">Painel do orientador · arquivo de orientandos</p>
          <h1 id="titulo-painel" className="display display--l">
            <Desclassificar atraso={150}>Seus orientandos</Desclassificar>
          </h1>
          <nav aria-label="Professor da demonstração">
            {/* Abas em pílula do Bootstrap (nav-pills) */}
            <ul className="nav nav-pills seletor">
              {dados.professores.map((p) => (
                <li key={p.id} className="nav-item">
                  <Link to={`/painel/${p.id}`} className={`nav-link${p.id === id ? ' active' : ''}`} aria-current={p.id === id ? 'page' : undefined}>
                    {p.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        <dl className="numeros" aria-label="Resumo">
          <div className="numero">
            <dt>Orientandos</dt>
            <dd>{resumo.orientandos}</dd>
          </div>
          <div className="numero">
            <dt>Vagas abertas</dt>
            <dd>
              {resumo.vagasAbertas}
              <span className="numero__de"> de {orientador.vagas.total}</span>
            </dd>
          </div>
          <div className={`numero${resumo.pedidosPendentes + resumo.aguardandoRevisao > 0 ? ' numero--lantern' : ''}`}>
            <dt>Aguardam você</dt>
            <dd>{resumo.pedidosPendentes + resumo.aguardandoRevisao}</dd>
          </div>
          <div className={`numero${resumo.atrasados > 0 ? ' numero--alerta' : ''}`}>
            <dt>Atrasados</dt>
            <dd>{resumo.atrasados}</dd>
          </div>
        </dl>

        {/* Região viva: confirma cada ação sem tirar o foco de onde a pessoa está */}
        <output className="saida-acao">
          {aviso && <span className={aviso.tipo === 'erro' ? 'erro' : 'aviso aviso--ok'}>{aviso.texto}</span>}
        </output>

        <div className="row g-4 align-items-start">
          <main className="col-lg-8 coluna-principal">
            {pedidos.length > 0 && (
              <section className="stack" aria-labelledby="titulo-pedidos">
                <h2 id="titulo-pedidos" className="label label--lantern">
                  Pedidos de orientação
                </h2>
                {pedidos.map((p) => (
                  <article key={p.id} className="card card--lantern" aria-label={`Pedido de ${p.aluna.nome}`}>
                    <div className="ficha__topo">
                      <div className="stack" style={{ gap: 4 }}>
                        <h3 style={{ fontSize: 20 }}>{p.aluna.nome}</h3>
                        <p className="muted" style={{ margin: 0 }}>
                          {p.aluna.detalhe} · pediu em {dataHora(p.quando)}
                        </p>
                      </div>
                      <Carimbo tom="andamento" atraso={300}>{`Afinidade ${p.afinidade}`}</Carimbo>
                    </div>
                    <p style={{ margin: 0 }}>
                      <span className="muted">Tema: </span>
                      {p.tema}
                    </p>
                    <p className="soft" style={{ margin: 0, fontSize: 15 }}>
                      Em comum com as suas áreas: <strong>{p.areaEmComum}</strong>.
                    </p>
                    <div className="linha">
                      <Botao disabled={ocupado} onClick={() => void agir(() => responderPedido(id, p.id, true), `Você aceitou orientar ${p.aluna.nome}. A etapa 3 dela foi liberada.`)}>
                        Aceitar orientação
                      </Botao>
                      <Botao variante="secundario" disabled={ocupado} onClick={() => setRecusar({ id: p.id, nome: p.aluna.nome })}>
                        Não posso neste semestre
                      </Botao>
                    </div>
                  </article>
                ))}
              </section>
            )}

            <section className="stack" aria-labelledby="titulo-orientandos">
              <h2 id="titulo-orientandos" className="label">
                Orientandos
              </h2>
              <ul className="orientandos">
                {orientandos.map((o) => {
                  const lembradoHoje = o.lembreteEm?.slice(0, 10) === hojeIso();
                  return (
                    <li key={o.id} className={`orientando orientando--${o.situacao}`}>
                      <div className="orientando__principal">
                        <span className="orientando__nome">{o.nome}</span>
                        <span className="orientando__tema">{o.tema}</span>
                        <span className="orientando__etapa">
                          Etapa {o.etapa}: {o.tituloEtapa}
                          {o.checklist && ` · checklist ${o.checklist.feitos} de ${o.checklist.total}`}
                        </span>
                        <span className="muted" style={{ fontSize: 14 }}>
                          {o.detalhe}
                        </span>
                      </div>
                      <div className="orientando__lado">
                        <Carimbo tom={SITUACAO[o.situacao].tom} atraso={400}>
                          {SITUACAO[o.situacao].texto}
                        </Carimbo>
                        {/* Lembrete só faz sentido para quem está atrasado (e para a aluna da demonstração).
                            O nome acessível começa pelo texto visível e acrescenta de quem é o lembrete. */}
                        {(o.situacao === 'atrasado' || o.interativo) && (
                          <button
                            type="button"
                            className="alternar-som"
                            disabled={ocupado || lembradoHoje}
                            aria-label={`${lembradoHoje ? 'Hotline avisada hoje' : 'Pedir lembrete à Hotline'} para ${o.nome}`}
                            onClick={() => void agir(() => enviarLembrete(id, o.id), `A Hotline vai lembrar ${o.nome} do prazo.`)}
                          >
                            {lembradoHoje ? 'Hotline avisada hoje' : 'Pedir lembrete à Hotline'}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                Sem ranking e sem nota de aluno: o painel mostra só etapa, prazo e o que depende de você.
              </p>
            </section>
          </main>

          <aside className="col-lg-4 coluna-lateral" aria-label="Devolutiva">
            {ana ? (
              <section className="card" aria-labelledby="titulo-devolutiva">
                <p className="label label--lantern">Devolutiva · {ana.nome}</p>
                <h2 id="titulo-devolutiva" style={{ fontSize: 18 }}>
                  {ana.situacao === 'aguardando-revisao' ? `Revisar a etapa ${ana.etapa}: ${ana.tituloEtapa}` : 'Escrever para a aluna'}
                </h2>
                <form className="formulario-conversa" onSubmit={aoEnviarDevolutiva}>
                  <label htmlFor="devolutiva" className="form-label formulario-conversa__rotulo">
                    Sua devolutiva
                  </label>
                  <textarea
                    id="devolutiva"
                    className="form-control"
                    rows={4}
                    maxLength={LIMITE}
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="O que está bom e o que ajustar"
                    aria-describedby="dica-devolutiva"
                  />
                  <span id="dica-devolutiva" className="muted" style={{ fontSize: 13 }}>
                    Aparece na hora no dossiê da aluna · {texto.length}/{LIMITE}
                  </span>
                  {ana.situacao === 'aguardando-revisao' ? (
                    <div className="linha">
                      <Botao disabled={ocupado} onClick={() => void aoRevisar('aprovar')}>
                        Aprovar a etapa
                      </Botao>
                      <Botao variante="secundario" disabled={ocupado || mensagem.length < 3} onClick={() => void aoRevisar('devolver')}>
                        Devolver para ajustes
                      </Botao>
                    </div>
                  ) : (
                    <div>
                      <Botao type="submit" disabled={ocupado || mensagem.length < 3}>
                        Enviar devolutiva
                      </Botao>
                    </div>
                  )}
                  {ana.situacao === 'aguardando-revisao' && (
                    <span className="muted" style={{ fontSize: 13 }}>
                      Para devolver, escreva o que precisa ser ajustado. Para aprovar, o texto é opcional.
                    </span>
                  )}
                </form>
                {devolutivas.length > 0 && (
                  <>
                    <h3 className="label">Enviadas</h3>
                    <ul className="devolutivas">
                      {devolutivas.map((d) => (
                        <li key={d.id} className={`devolutiva devolutiva--${d.tipo}`}>
                          <span className="devolutiva__topo">
                            {d.tipo === 'lembrete' ? 'Lembrete da Hotline' : 'Devolutiva'} · etapa {d.etapa} · {dataHora(d.quando)}
                          </span>
                          <span className="devolutiva__texto">{d.texto}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            ) : (
              <section className="card card--tracejado" aria-labelledby="titulo-como-testar">
                <h2 id="titulo-como-testar" style={{ fontSize: 18 }}>
                  Como ver o painel em ação
                </h2>
                <ol className="passos">
                  <li>Troque para a visão da aluna e abra a aba Orientadores.</li>
                  <li>Clique em "Solicitar orientação" na ficha de {orientador.nome}.</li>
                  <li>Volte aqui: o pedido aparece no topo, pronto para aceitar.</li>
                </ol>
                <Botao para={`/orientadores/${orientador.id}`} variante="secundario" largo>
                  Ir para a ficha, como aluna
                </Botao>
              </section>
            )}
          </aside>
        </div>

        <footer className="rodape">PROTÓTIPO · DADOS FICTÍCIOS · ALUNOS E PROFESSORES INVENTADOS</footer>

        <Confirmacao
          aberta={recusar !== null}
          titulo="Recusar o pedido?"
          confirmar="Recusar o pedido"
          cancelar="Voltar"
          aoFechar={() => setRecusar(null)}
          aoConfirmar={() => {
            const pedido = recusar;
            setRecusar(null);
            if (pedido) void agir(() => responderPedido(id, pedido.id, false), 'Pedido recusado. A aluna foi avisada e pode escolher outro professor.');
          }}
        >
          <p className="m-0">
            {recusar?.nome} vai ver no dossiê que você não pode orientar neste semestre e volta a escolher um orientador. Não dá
            para desfazer.
          </p>
        </Confirmacao>
      </div>
    </div>
  );
}
