import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { ErroLantern, ligarOsFios, statusLantern, type Fichas, type IdFicha, type RespostaRecorte } from '../api/lantern';
import { Cabecalho } from '../components/Cabecalho';
import { Carimbo } from '../components/Carimbo';
import { Desclassificar } from '../components/Desclassificar';

/** As 5 fichas do quadro, na ordem em que a investigação acontece. */
const FICHAS: { id: IdFicha; titulo: string; pergunta: string; dica: string; obrigatoria: boolean }[] = [
  {
    id: 'interesse',
    titulo: 'Interesse',
    pergunta: 'Que assunto te puxa, mesmo sem você saber direito por quê?',
    dica: 'Ex.: acessibilidade, jogos, finanças pessoais, saúde mental no trabalho',
    obrigatoria: true,
  },
  {
    id: 'problema',
    titulo: 'Problema',
    pergunta: 'O que, nesse assunto, te incomoda ou parece mal resolvido?',
    dica: 'Ex.: colegas com baixa visão sofrem para usar o ambiente da faculdade',
    obrigatoria: true,
  },
  {
    id: 'publico',
    titulo: 'Público',
    pergunta: 'Quem sente esse problema na pele?',
    dica: 'Ex.: alunos do primeiro ano, pequenas empresas, professores',
    obrigatoria: false,
  },
  {
    id: 'contexto',
    titulo: 'Contexto',
    pergunta: 'Onde isso acontece?',
    dica: 'Ex.: no curso, numa empresa, num aplicativo, na sua cidade',
    obrigatoria: false,
  },
  {
    id: 'viabilidade',
    titulo: 'Viabilidade',
    pergunta: 'O que você tem nas mãos: tempo, acesso a pessoas, dados, ferramentas?',
    dica: 'Ex.: um semestre, acesso a 10 colegas, sei usar Figma',
    obrigatoria: false,
  },
];

const VAZIAS: Fichas = { interesse: '', problema: '', publico: '', contexto: '', viabilidade: '' };

/** Exemplo fictício (a mesma Ana Souza do dossiê), para a demonstração andar rápido. */
const EXEMPLO: Fichas = {
  interesse: 'Acessibilidade digital e educação',
  problema: 'Colegas com baixa visão se perdem no ambiente virtual da faculdade e desistem de atividades',
  publico: 'Alunos de graduação com baixa visão ou que usam leitor de tela',
  contexto: 'O ambiente virtual de aprendizagem usado no meu curso',
  viabilidade: 'Um semestre, acesso a uns 10 colegas, sei usar ferramentas de teste de acessibilidade',
};

const LETRAS = ['A', 'B', 'C'];
const LIMITE = 600;

/**
 * Tela — Sala de Recorte do tema.
 * O aluno preenche fichas num quadro de investigação; a Lantern "liga os fios" e devolve 3 recortes possíveis.
 * Ela sugere caminhos; o tema e o texto continuam sendo do aluno (e a decisão é com o orientador).
 */
export function Recorte() {
  const [fichas, setFichas] = useState<Fichas>(VAZIAS);
  const [online, setOnline] = useState<boolean | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RespostaRecorte | null>(null);
  const [emFoco, setEmFoco] = useState<number | null>(null); // recorte com o "fio puxado": destaca as fichas ligadas
  const [copiado, setCopiado] = useState(false);
  const tituloResultado = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    statusLantern().then((s) => setOnline(s.online));
  }, []);

  useEffect(() => {
    if (resultado) tituloResultado.current?.focus();
  }, [resultado]);

  const pronto = fichas.interesse.trim().length >= 3 && fichas.problema.trim().length >= 3;
  const ligadas = emFoco !== null && resultado ? new Set(resultado.recortes[emFoco]?.ligacoes ?? []) : null;

  async function aoLigar(e: FormEvent) {
    e.preventDefault();
    if (!pronto || carregando) return;
    setErro(null);
    setCarregando(true);
    setResultado(null);
    setCopiado(false);
    try {
      setResultado(await ligarOsFios(fichas));
    } catch (falha) {
      if (falha instanceof ErroLantern && falha.codigo === 'IA_NAO_CONFIGURADA') setOnline(false);
      setErro(falha instanceof ErroLantern ? falha.message : 'Algo deu errado. Tente de novo.');
    } finally {
      setCarregando(false);
    }
  }

  async function copiarParaOrientador() {
    if (!resultado) return;
    const texto = [
      'Sala de Recorte do Threshold: recortes para discutir com o orientador',
      '',
      ...resultado.recortes.flatMap((r, i) => [
        `Recorte ${LETRAS[i]}: ${r.titulo}`,
        `Pergunta: ${r.pergunta}`,
        `Por que: ${r.porQue}`,
        `Risco: ${r.risco}`,
        `Primeiro passo: ${r.primeiroPasso}`,
        '',
      ]),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      setErro('Não deu para copiar automaticamente. Selecione o texto dos recortes e copie.');
    }
  }

  return (
    <div className="page" data-setor="02">
      <div className="page__inner">
        <Cabecalho />

        <section className="stack" aria-labelledby="titulo-recorte">
          <p className="label label--lantern">Sala de Recorte · investigação do tema</p>
          <h1 id="titulo-recorte" className="display display--l">
            <Desclassificar atraso={150}>Recorte o seu tema</Desclassificar>
          </h1>
          <p className="soft" style={{ margin: 0, maxWidth: 760 }}>
            Escolher o tema foi a maior dificuldade de quem respondeu à nossa pesquisa. Preencha as fichas do quadro com
            palavras suas, e a Lantern liga os fios em três recortes possíveis. Ela sugere caminhos; o tema é seu, e a
            decisão final é com o orientador.
          </p>
        </section>

        {online === false && (
          <div className="aviso">
            <strong>A Lantern está offline.</strong> Configure o provedor de IA no <code>.env</code> para ligar os fios
            (passo a passo em <code>docs/05-como-rodar-e-testar.md</code>).
          </div>
        )}

        <form onSubmit={aoLigar} className="stack" style={{ gap: 20 }} aria-describedby="regra-fichas">
          <div className="quadro">
            {FICHAS.map((f, i) => (
              <div
                key={f.id}
                className={`ficha-quadro${ligadas?.has(f.id) ? ' ficha-quadro--ligada' : ''}`}
                style={{ '--giro': `${[-1.2, 0.8, -0.6, 1.1, -0.9][i]}deg` } as CSSProperties}
              >
                <span className="ficha-quadro__alfinete" aria-hidden="true" />
                <label htmlFor={`ficha-${f.id}`} className="ficha-quadro__titulo">
                  {f.titulo}
                  {f.obrigatoria ? <span className="accent"> *</span> : <span className="muted"> (opcional)</span>}
                </label>
                <p className="ficha-quadro__pergunta" id={`pergunta-${f.id}`}>
                  {f.pergunta}
                </p>
                <textarea
                  id={`ficha-${f.id}`}
                  rows={3}
                  maxLength={LIMITE}
                  required={f.obrigatoria}
                  value={fichas[f.id]}
                  placeholder={f.dica}
                  aria-describedby={`pergunta-${f.id}`}
                  onChange={(e) => setFichas((atual) => ({ ...atual, [f.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <p id="regra-fichas" className="muted" style={{ margin: 0, fontSize: 14 }}>
            * Interesse e Problema são obrigatórias. Não escreva nomes de pessoas: se escrever, eles viram códigos antes de
            sair do servidor.
          </p>

          <div className="linha">
            <button type="submit" className="btn btn-lantern botao" disabled={!pronto || carregando || online === false}>
              {carregando ? 'Ligando os fios…' : 'Ligar os fios'}
            </button>
            <button type="button" className="btn btn-arquivo botao" onClick={() => setFichas(EXEMPLO)} disabled={carregando}>
              Preencher com o exemplo da Ana
            </button>
            {(fichas !== VAZIAS || resultado) && (
              <button
                type="button"
                className="btn btn-arquivo botao"
                onClick={() => {
                  setFichas(VAZIAS);
                  setResultado(null);
                  setErro(null);
                }}
                disabled={carregando}
              >
                Limpar o quadro
              </button>
            )}
          </div>
        </form>

        {/* Região viva sempre presente, para leitores de tela ouvirem o andamento */}
        <output className="visually-hidden">{carregando ? 'A Lantern está ligando os fios entre as suas fichas.' : ''}</output>
        {carregando && (
          <div className="fios-carregando" aria-hidden="true">
            <svg viewBox="0 0 320 60" aria-hidden="true" focusable="false">
              <path className="fio" d="M10 30 C 80 -10, 120 70, 160 30 S 260 -10, 310 30" />
              <circle cx="10" cy="30" r="5" className="alfinete-svg" />
              <circle cx="160" cy="30" r="5" className="alfinete-svg" />
              <circle cx="310" cy="30" r="5" className="alfinete-svg" />
            </svg>
            <span>A Lantern está ligando os fios entre as suas fichas… Ela pensa antes de responder: pode levar até meio minuto.</span>
          </div>
        )}

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        {resultado && (
          <section className="stack" style={{ gap: 20 }} aria-labelledby="titulo-recortes">
            <h2 id="titulo-recortes" className="label label--lantern" ref={tituloResultado} tabIndex={-1}>
              Três recortes possíveis
            </h2>
            <ol className="recortes">
              {resultado.recortes.map((r, i) => (
                <li
                  key={i}
                  className={`recorte${emFoco === i ? ' recorte--em-foco' : ''}`}
                >
                  <div className="recorte__topo">
                    <Carimbo tom="andamento" atraso={200 + i * 220}>
                      {`Recorte ${LETRAS[i]}`}
                    </Carimbo>
                  </div>
                  <h3 className="recorte__titulo">{r.titulo}</h3>
                  <dl className="recorte__campos">
                    <dt>Pergunta de pesquisa</dt>
                    <dd>{r.pergunta}</dd>
                    <dt>Por que dá certo</dt>
                    <dd>{r.porQue}</dd>
                    <dt>Risco</dt>
                    <dd>{r.risco}</dd>
                    <dt>Primeiro passo</dt>
                    <dd>{r.primeiroPasso}</dd>
                  </dl>
                  {r.ligacoes.length > 0 && (
                    <p className="recorte__fios">
                      <span className="recorte__fio" aria-hidden="true" />
                      Ligado a: {r.ligacoes.map((l) => FICHAS.find((f) => f.id === l)?.titulo).join(' · ')}
                    </p>
                  )}
                  {/* Destaca no quadro (contorno vermelho) as fichas que sustentam este recorte */}
                  <button
                    type="button"
                    className="recorte__puxar"
                    aria-pressed={emFoco === i}
                    onClick={() => setEmFoco(emFoco === i ? null : i)}
                  >
                    Puxar o fio deste recorte
                  </button>
                </li>
              ))}
            </ol>

            {resultado.perguntaParaVoce && (
              <div className="card card--lantern">
                <p className="label label--lantern">Lantern · uma pergunta para você</p>
                <p style={{ margin: 0 }}>{resultado.perguntaParaVoce}</p>
              </div>
            )}

            <div className="linha">
              <button type="button" className="btn btn-lantern botao" onClick={copiarParaOrientador}>
                Copiar para levar ao orientador
              </button>
            </div>
            <output className="saida-acao">{copiado ? 'Recortes copiados. Cole no e-mail ou na conversa com o orientador.' : ''}</output>

            <details className="card">
              <summary>Proteção ativa: o que a IA recebeu</summary>
              <pre className="enviado-ia" aria-label="Fichas enviadas à IA">
                {resultado.protecao.enviadoAIA}
              </pre>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                {resultado.protecao.substituicoes === 0
                  ? 'Nenhum dado pessoal encontrado nas fichas.'
                  : `${resultado.protecao.substituicoes} trecho(s) protegido(s) antes de sair do servidor.`}
              </p>
            </details>
          </section>
        )}

        <footer className="rodape">DEMONSTRAÇÃO · RECORTES GERADOS POR IA: DISCUTA COM SEU ORIENTADOR ANTES DE DECIDIR</footer>
      </div>
    </div>
  );
}
