import { useState } from 'react';
import { Link } from 'react-router';
import {
  cancelarPedido,
  enviarParaRevisao,
  marcarItem,
  mensagemDeErro,
  obterDossie,
  reiniciarDemo,
  type Devolutiva,
  type Dossie as DadosDossie,
} from '../api/threshold';
import { Botao } from '../components/Botao';
import { Carimbo } from '../components/Carimbo';
import { Confirmacao } from '../components/Confirmacao';
import { Cabecalho } from '../components/Cabecalho';
import { Desclassificar } from '../components/Desclassificar';
import { Etapa } from '../components/Etapa';
import { EstadoDaTela } from '../components/EstadoDaTela';
import { useRecurso } from '../hooks/useRecurso';
import { ligarHotline } from '../prazos/hotline';
import { calcularPrazos, dataCurta, textoDias, type Urgencia } from '../prazos/prazos';

const CARIMBO_DO_PRAZO: Record<Urgencia, { tom: 'alerta' | 'andamento' | 'aprovado'; texto: string } | null> = {
  vencido: { tom: 'alerta', texto: 'Vencido' },
  hoje: { tom: 'alerta', texto: 'Hoje' },
  urgente: { tom: 'alerta', texto: 'Urgente' },
  proximo: { tom: 'andamento', texto: 'Próximo' },
  tranquilo: null,
};

const TIPO_DEVOLUTIVA: Record<Devolutiva['tipo'], string> = { devolutiva: 'Devolutiva', lembrete: 'Lembrete da Hotline', sistema: 'Aviso' };

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** Para onde cada item do checklist leva dentro da plataforma. */
function atalhoDoItem(texto: string): { rotulo: string; para: string } | null {
  if (texto.includes('Sala de Recorte')) return { rotulo: 'Abrir a Sala de Recorte', para: '/recorte' };
  if (texto.includes('Archivist')) return { rotulo: 'Abrir as Referências', para: '/referencias' };
  if (texto.includes('Board')) return { rotulo: 'Perguntar ao Board', para: `/lantern?pergunta=${encodeURIComponent('Que orientador combina com o meu tema?')}` };
  if (texto.includes('fichas') || texto.includes('Solicitar orientação')) return { rotulo: 'Ver orientadores', para: '/orientadores' };
  return null;
}

/** O cartão "próximo passo" muda conforme o estado do dossiê. */
function proximoPasso(d: DadosDossie): { titulo: string; texto: string; acao?: { rotulo: string; para: string } } {
  if (d.concluido) return { titulo: 'Dossiê completo', texto: 'Todas as etapas foram aprovadas. Bom trabalho na banca!' };
  const atual = d.etapas.find((e) => e.estado === 'atual' || e.estado === 'em-revisao');
  if (!atual) return { titulo: 'Tudo em dia', texto: 'Nenhuma etapa aberta agora.' };
  if (atual.estado === 'em-revisao') {
    return {
      titulo: 'Aguardando a revisão',
      texto: `A etapa "${atual.titulo}" está com ${d.orientador?.nome ?? 'o orientador'}. Você recebe a devolutiva aqui.`,
      acao: { rotulo: 'Ver como orientador (demo)', para: '/painel' },
    };
  }
  if (d.pedido?.estado === 'pendente') {
    return {
      titulo: 'Pedido enviado',
      texto: `${d.pedido.orientadorNome} recebeu o seu pedido de orientação. A resposta aparece aqui.`,
      acao: { rotulo: 'Ver como orientador (demo)', para: `/painel/${d.pedido.orientadorId}` },
    };
  }
  const pendente = atual.checklist.find((i) => !i.feito);
  if (!pendente) {
    return { titulo: 'Checklist completo', texto: `Envie a etapa "${atual.titulo}" para o orientador revisar. O botão está na própria etapa.` };
  }
  return { titulo: pendente.texto, texto: `Etapa ${atual.numero}: ${atual.titulo}. ${atual.descricao}`, acao: atalhoDoItem(pendente.texto) ?? undefined };
}

/** Tela 2 — Dossiê do aluno: etapas com checklist que salva, prazos, devolutivas e próximo passo. */
export function Dossie() {
  // Atualiza sozinho a cada 4 s: se o orientador responder em outra janela, a tela muda sem recarregar
  const { dados, erro, recarregar, definir } = useRecurso(obterDossie, 4000);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);
  const [hoje] = useState(() => new Date()); // fixo durante a visita: a contagem não muda no meio da tela

  async function agir(acao: () => Promise<DadosDossie>) {
    setOcupado(true);
    setAviso(null);
    try {
      definir(await acao());
    } catch (e) {
      setAviso(mensagemDeErro(e));
      recarregar(); // desfaz qualquer mudança otimista: volta ao que o servidor tem
    } finally {
      setOcupado(false);
    }
  }

  /** Marca na hora (resposta imediata ao clique) e confirma com o servidor em seguida. */
  function aoMarcar(id: string, feito: boolean) {
    if (!dados) return;
    definir({
      ...dados,
      etapas: dados.etapas.map((e) => ({ ...e, checklist: e.checklist.map((i) => (i.id === id ? { ...i, feito } : i)) })),
    });
    void agir(() => marcarItem(id, feito));
  }

  if (!dados) {
    return (
      <div className="page" data-setor="01">
        <div className="page__inner">
          <Cabecalho />
          <EstadoDaTela titulo="Dossiê" erro={erro} aoTentarDeNovo={recarregar} />
        </div>
      </div>
    );
  }

  const { etapas } = dados;
  const concluidas = etapas.filter((e) => e.estado === 'aprovado').length;
  const percentual = Math.round((concluidas / etapas.length) * 100);
  const prazos = calcularPrazos(dados.prazos, hoje);
  const passo = proximoPasso(dados);
  const primeiraBloqueada = etapas.find((e) => e.estado === 'classificado')?.numero;

  return (
    <div className="page" data-setor="01">
      <div className="page__inner">
        <Cabecalho usuario={dados.aluna} />

        <div className="row g-4 align-items-start">
          <main className="col-lg-8 coluna-principal">
            <section className="stack" aria-labelledby="titulo-dossie">
              <p className="label">Dossiê {dados.protocolo}</p>
              <h1 id="titulo-dossie" className="display display--l">
                <Desclassificar atraso={150}>{dados.tema}</Desclassificar>
              </h1>
              <p className="muted linha" style={{ margin: 0, gap: 24, fontSize: 15 }}>
                <span>
                  <strong className="soft">
                    {concluidas} de {etapas.length}
                  </strong>{' '}
                  etapas concluídas
                </span>
                <span>
                  Entrega oficial: <strong className="soft">{dataCurta(dados.entregaOficial, true)}</strong>
                </span>
                <span>
                  Orientador: <strong className="soft">{dados.orientador?.nome ?? 'ainda não escolhido'}</strong>
                </span>
              </p>
              {/* Barra de progresso do Bootstrap (div com role, como na documentação dele); o aria diz o valor ao leitor de tela */}
              <div
                className="progress"
                // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- é o padrão da barra do Bootstrap
                role="progressbar"
                aria-label="Progresso do TCC"
                aria-valuemin={0}
                aria-valuemax={etapas.length}
                aria-valuenow={concluidas}
                aria-valuetext={`${concluidas} de ${etapas.length} etapas (${percentual}%)`}
              >
                <div className="progress-bar" style={{ width: `${percentual}%` }} />
              </div>
            </section>

            <section className="stack" aria-labelledby="titulo-etapas">
              <h2 id="titulo-etapas" className="label">
                Etapas do dossiê
              </h2>
              <ol className="stack" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {etapas.map((etapa) => {
                  const completa = etapa.checklist.every((i) => i.feito);
                  return (
                    <Etapa
                      key={etapa.numero}
                      etapa={etapa}
                      ocupado={ocupado}
                      aoMarcar={aoMarcar}
                      status={etapa.numero === primeiraBloqueada ? `CLASSIFICADO · LIBERA NA ETAPA ${String(etapa.numero - 1).padStart(2, '0')}` : undefined}
                    >
                      {etapa.estado === 'atual' && etapa.numero === 2 && dados.pedido?.estado !== 'pendente' && (
                        <Botao para="/orientadores">Ver orientadores</Botao>
                      )}
                      {etapa.estado === 'atual' && etapa.numero === 2 && dados.pedido?.estado === 'pendente' && (
                        <Botao variante="secundario" disabled={ocupado} onClick={() => void agir(cancelarPedido)}>
                          Cancelar o pedido
                        </Botao>
                      )}
                      {etapa.estado === 'atual' && etapa.numero >= 3 && (
                        <>
                          <Botao disabled={ocupado || !completa} onClick={() => void agir(enviarParaRevisao)}>
                            Enviar etapa ao orientador
                          </Botao>
                          {!completa && <span className="muted" style={{ fontSize: 14 }}>Conclua o checklist para enviar.</span>}
                        </>
                      )}
                    </Etapa>
                  );
                })}
              </ol>
              {/* Região viva: erros de ação e confirmações chegam aos leitores de tela sem tirar o foco */}
              <output className="saida-acao">{aviso && <span className="erro">{aviso}</span>}</output>
            </section>
          </main>

          <aside className="col-lg-4 coluna-lateral" aria-label="Próximos passos">
            <section className="card card--lantern lantern-brilho" aria-labelledby="titulo-proximo">
              <p className="label label--lantern">Lantern · próximo passo</p>
              <h2 id="titulo-proximo" style={{ fontSize: 22 }}>
                {passo.titulo}
              </h2>
              <p className="soft" style={{ margin: 0, fontSize: 15 }}>
                {passo.texto}
              </p>
              {passo.acao && (
                <Botao para={passo.acao.para} largo>
                  {passo.acao.rotulo}
                </Botao>
              )}
            </section>

            <section className="card" aria-labelledby="titulo-prazos">
              <p className="label label--lantern">Hotline · linha direta</p>
              <h2 id="titulo-prazos" style={{ fontSize: 18 }}>
                Prazos
              </h2>
              <ul className="prazos">
                {prazos.map((p) => {
                  const carimbo = p.concluido ? { tom: 'aprovado' as const, texto: 'Feito' } : CARIMBO_DO_PRAZO[p.urgencia];
                  return (
                    <li key={p.id} className="prazos__item">
                      <span className="stack" style={{ gap: 2 }}>
                        <span className="prazos__titulo">{p.titulo}</span>
                        <span className="prazos__quando">
                          {dataCurta(p.data, true)}
                          {!p.concluido && ` · ${textoDias(p.dias)}`}
                        </span>
                      </span>
                      {carimbo && (
                        <Carimbo tom={carimbo.tom} atraso={1400}>
                          {carimbo.texto}
                        </Carimbo>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                A Hotline liga para você quando um prazo está a 14 dias ou menos.
              </p>
              <Botao variante="secundario" largo onClick={ligarHotline}>
                Simular ligação da Hotline
              </Botao>
            </section>

            <section className="card" aria-labelledby="titulo-devolutivas">
              <h2 id="titulo-devolutivas" style={{ fontSize: 18 }}>
                Do seu orientador
              </h2>
              {dados.devolutivas.length === 0 ? (
                <p className="muted" style={{ margin: 0, fontSize: 15 }}>
                  As devolutivas e os avisos do orientador aparecem aqui.
                </p>
              ) : (
                <ul className="devolutivas">
                  {dados.devolutivas.map((d) => (
                    <li key={d.id} className={`devolutiva devolutiva--${d.tipo}`}>
                      <span className="devolutiva__topo">
                        {TIPO_DEVOLUTIVA[d.tipo]} · etapa {d.etapa} · {dataHora(d.quando)}
                      </span>
                      <span className="devolutiva__texto">{d.texto}</span>
                      {d.tipo === 'devolutiva' && <span className="devolutiva__autor">{d.autor}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>

        <footer className="rodape rodape--acoes">
          <span>PROTÓTIPO · DADOS FICTÍCIOS · O DOSSIÊ FICA SALVO NO SERVIDOR ATÉ ELE REINICIAR</span>
          <span className="linha" style={{ gap: 16 }}>
            <Link to="/painel">Ver como orientador</Link>
            <button type="button" className="link-botao" disabled={ocupado} onClick={() => setConfirmarReinicio(true)}>
              Reiniciar a demonstração
            </button>
          </span>
        </footer>

        <Confirmacao
          aberta={confirmarReinicio}
          titulo="Reiniciar a demonstração?"
          confirmar="Reiniciar"
          aoFechar={() => setConfirmarReinicio(false)}
          aoConfirmar={() => {
            setConfirmarReinicio(false);
            void agir(reiniciarDemo);
          }}
        >
          <p className="m-0">
            O dossiê da Ana volta ao começo: checklist desmarcado, pedido de orientação, devolutivas e etapas aprovadas são
            apagados. Isso vale também para quem estiver vendo como orientador.
          </p>
        </Confirmacao>
      </div>
    </div>
  );
}
