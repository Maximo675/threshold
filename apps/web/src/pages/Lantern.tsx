import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router';
import { prepararSom } from '../audio/somMaquina';
import { enviarMensagem, ErroLantern, statusLantern, type IdAgente, type MensagemConversa } from '../api/lantern';
import { Cabecalho } from '../components/Cabecalho';
import { Tarja } from '../components/Carimbo';
import { Desclassificar } from '../components/Desclassificar';
import { MaquinaDeEscrever } from '../components/MaquinaDeEscrever';
import { TextoFormatado } from '../components/TextoFormatado';
import { AGENTES, SUGESTOES } from '../data/agentes';
import { useMenosMovimento } from '../hooks/useMenosMovimento';
import { useSons } from '../hooks/useSons';

interface ItemConversa extends MensagemConversa {
  id: number;
  agente?: IdAgente;
  animar?: boolean;
}

const BOAS_VINDAS =
  'Olá! Eu sou a **Lantern**. Posso revisar suas referências com o **Archivist**, mostrar seu próximo passo com a **Hotline** e sugerir orientadores com o **Board**.\nEu oriento e explico, mas o texto do TCC continua sendo seu.';
const LIMITE = 4000;

/** Tela 3 — Conversa com a Lantern (demo com IA real). */
export function Lantern() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [itens, setItens] = useState<ItemConversa[]>([]);
  // ?pergunta=... (vindo da ficha do orientador) já deixa a pergunta escrita; o aluno decide se envia
  const [parametros] = useSearchParams();
  const [texto, setTexto] = useState(() => (parametros.get('pergunta') ?? '').slice(0, LIMITE));
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // Limite por minuto: até quando esperar e quantos segundos faltam (o botão mostra a contagem)
  const [espera, setEspera] = useState<number | null>(null); // segundos informados pela API
  const [faltam, setFaltam] = useState(0);
  const [protecao, setProtecao] = useState<{ enviadoAIA: string; substituicoes: number } | null>(null);
  const [som, alternarSom] = useSons();
  const reduzir = useMenosMovimento();
  const proximoId = useRef(1);
  const fimDaConversa = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    statusLantern().then((s) => setOnline(s.online));
  }, []);

  useEffect(() => {
    fimDaConversa.current?.scrollIntoView?.({ block: 'nearest' });
  }, [itens, carregando]);

  useEffect(() => {
    if (espera === null) return;
    const fim = Date.now() + espera * 1000;
    const id = window.setInterval(() => {
      const restante = Math.ceil((fim - Date.now()) / 1000);
      if (restante <= 0) {
        setEspera(null);
        setErro(null);
      } else setFaltam(restante);
    }, 250);
    return () => window.clearInterval(id);
  }, [espera]);

  const esperando = espera !== null;

  async function enviar(conteudo: string) {
    const limpo = conteudo.trim();
    if (!limpo || carregando || espera !== null) return;
    if (som) prepararSom(); // precisa acontecer no gesto (clique/Enter): o navegador só libera áudio assim
    setErro(null);
    const doAluno: ItemConversa = { id: proximoId.current++, papel: 'aluno', texto: limpo };
    const historico = [...itens, doAluno];
    setItens(historico);
    setTexto('');
    setCarregando(true);
    try {
      // Só as 10 últimas mensagens vão para o servidor (contexto suficiente, custo controlado)
      const r = await enviarMensagem(historico.slice(-10).map(({ papel, texto: t }) => ({ papel, texto: t })));
      setItens((atual) => [...atual, { id: proximoId.current++, papel: 'lantern', texto: r.texto, agente: r.agente, animar: true }]);
      setProtecao(r.protecao);
    } catch (e) {
      const mensagem = e instanceof ErroLantern ? e.message : 'Algo deu errado. Tente de novo.';
      if (e instanceof ErroLantern && e.codigo === 'IA_NAO_CONFIGURADA') setOnline(false);
      if (e instanceof ErroLantern && e.tenteEmSegundos) {
        setFaltam(e.tenteEmSegundos);
        setEspera(e.tenteEmSegundos);
      }
      setErro(mensagem);
      setItens((atual) => atual.filter((i) => i.id !== doAluno.id));
      setTexto(limpo);
    } finally {
      setCarregando(false);
      campo.current?.focus();
    }
  }

  const aoEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(texto);
  };

  // Enter envia; Shift+Enter quebra a linha
  const aoTeclar = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void enviar(texto);
    }
  };

  return (
    <div className="page" data-setor="04">
      <div className="page__inner">
        <Cabecalho />

        <section className="stack" aria-labelledby="titulo-lantern">
          <p className="label label--lantern">Lantern · arquivo de conversa</p>
          <h1 id="titulo-lantern" className="display display--l">
            <Desclassificar>Converse com a Lantern</Desclassificar>
          </h1>
          <p className="soft" style={{ margin: 0 }}>
            Ela chama o especialista certo para cada pergunta. Ela orienta; o texto continua sendo seu.
          </p>
        </section>

        <ul className="agentes" aria-label="Agentes do Threshold">
          {(Object.keys(AGENTES) as IdAgente[]).map((id) => (
            <li key={id} className={`agente agente--${id}`}>
              <span className="agente__nome">{AGENTES[id].nome}</span>
              <span className="agente__papel">{AGENTES[id].papel}</span>
              <span className="agente__descricao">{AGENTES[id].descricao}</span>
            </li>
          ))}
        </ul>

        {online === false && (
          <div className="aviso">
            <strong>A Lantern está offline.</strong> Para conversar de verdade, configure o provedor de IA no arquivo{' '}
            <code>.env</code> (passo a passo em <code>docs/05-como-rodar-e-testar.md</code>).
          </div>
        )}

        <div className="row g-4 align-items-start">
          <main className="col-lg-8 coluna-principal">
            <ol className="conversa" aria-label="Conversa com a Lantern" aria-live="polite" aria-busy={carregando}>
              <li className="mensagem mensagem--lantern">
                <span className="mensagem__autor">Lantern</span>
                <p className="mensagem__texto">
                  <TextoFormatado texto={BOAS_VINDAS} />
                </p>
              </li>
              {itens.map((item) =>
                item.papel === 'aluno' ? (
                  <li key={item.id} className="mensagem mensagem--aluno">
                    <span className="mensagem__autor">Você</span>
                    <p className="mensagem__texto">{item.texto}</p>
                  </li>
                ) : (
                  <li key={item.id} className="mensagem mensagem--lantern">
                    <span className="mensagem__autor">
                      Lantern
                      {item.agente && item.agente !== 'lantern' && (
                        <span className={`selo selo--${item.agente}`}> · via {AGENTES[item.agente].nome}</span>
                      )}
                    </span>
                    <p className="mensagem__texto">
                      {item.animar ? <MaquinaDeEscrever texto={item.texto} som={som} /> : <TextoFormatado texto={item.texto} />}
                    </p>
                  </li>
                ),
              )}
              {carregando && (
                <li className="mensagem mensagem--lantern mensagem--carregando">
                  <span className="lampada-mini" aria-hidden="true" />
                  <span>A Lantern está consultando o arquivo…</span>
                </li>
              )}
            </ol>
            <div ref={fimDaConversa} />

            {itens.length === 0 && (
              <div className="stack">
                <p className="label">Experimente perguntar</p>
                <div className="sugestoes">
                  {SUGESTOES.map((s) => (
                    <button key={s} type="button" className="sugestao" onClick={() => void enviar(s)} disabled={carregando || esperando || online === false}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {erro && (
              <p className="erro" role="alert">
                {erro}
              </p>
            )}

            <form className="formulario-conversa" onSubmit={aoEnviar}>
              <label htmlFor="mensagem" className="form-label formulario-conversa__rotulo">
                Sua mensagem
              </label>
              <textarea
                id="mensagem"
                className="form-control"
                ref={campo}
                rows={3}
                maxLength={LIMITE}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={aoTeclar}
                placeholder="Cole uma referência ou pergunte sobre o seu TCC"
                aria-describedby="dica-mensagem"
              />
              <div className="linha" style={{ justifyContent: 'space-between' }}>
                <span id="dica-mensagem" className="muted" style={{ fontSize: 13 }}>
                  Enter envia · Shift+Enter quebra a linha · {texto.length}/{LIMITE}
                </span>
                {/* Sem animação (reduzir movimento) a máquina não toca, então o botão fica só no painel da Hotline */}
                {!reduzir && (
                  <button type="button" className="alternar-som" aria-pressed={som} onClick={alternarSom}>
                    <span aria-hidden="true">{som ? '♪' : '–'}</span> Sons
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-lantern botao"
                  disabled={carregando || esperando || !texto.trim() || online === false}
                >
                  {esperando ? `Aguarde ${faltam} s` : 'Enviar à Lantern'}
                </button>
              </div>
            </form>
          </main>

          <aside className="col-lg-4 coluna-lateral" aria-label="Proteção de dados">
            <section className="card" aria-labelledby="titulo-protecao">
              <h2 id="titulo-protecao" style={{ fontSize: 18 }}>
                Proteção ativa
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                Antes de sair do servidor, nomes e e-mails viram códigos, e CPF e telefone são removidos. Veja o que a IA recebeu
                da sua última mensagem:
              </p>
              {protecao ? (
                <>
                  <pre className="enviado-ia" aria-label="Texto enviado à IA">
                    {protecao.enviadoAIA}
                  </pre>
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    {protecao.substituicoes === 0
                      ? 'Nenhum dado pessoal encontrado nesta conversa.'
                      : `${protecao.substituicoes} trecho(s) protegido(s) nesta conversa.`}
                  </p>
                </>
              ) : (
                <p className="muted linha" style={{ margin: 0, fontSize: 14, gap: 10 }}>
                  <Tarja largura={90} rotulo="" />
                  <span>Aparece depois da primeira mensagem. Teste escrevendo &quot;Sou a Ana Souza&quot;.</span>
                </p>
              )}
            </section>
          </aside>
        </div>

        <footer className="rodape">DEMONSTRAÇÃO · DADOS FICTÍCIOS · RESPOSTAS GERADAS POR IA: CONFIRA COM SEU ORIENTADOR</footer>
      </div>
    </div>
  );
}
