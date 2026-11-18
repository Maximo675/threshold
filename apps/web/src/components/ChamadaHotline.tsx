import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { prepararSom, obterAudio } from '../audio/contexto';
import { DURACAO_TELEFONE_MS, tocarTelefone } from '../audio/telefone';
import { obterDossie } from '../api/threshold';
import { useSons } from '../hooks/useSons';
import { EVENTO_LIGAR } from '../prazos/hotline';
import { calcularPrazos, chaveDoDia, dataCurta, prazosParaLigar, textoDias, type Prazo, type PrazoCalculado } from '../prazos/prazos';
import { MaquinaDeEscrever } from './MaquinaDeEscrever';
import { TelefoneHotline } from './TelefoneHotline';

const CHAVE_ATENDIDA = 'threshold:hotline-atendida'; // localStorage: dia em que a pessoa atendeu
const CHAVE_ADIADA = 'threshold:hotline-adiada'; // sessionStorage: "agora não" vale até fechar o navegador
const ATRASO_MS = 2200; // deixa a abertura "acessando arquivo" terminar antes de tocar

type Estado = 'oculta' | 'tocando' | 'atendida';

const AGORA = () => new Date();

function ler(armazenamento: () => Storage, chave: string): string | null {
  try {
    return armazenamento().getItem(chave);
  } catch {
    return null;
  }
}

function gravar(armazenamento: () => Storage, chave: string, valor: string) {
  try {
    armazenamento().setItem(chave, valor);
  } catch {
    /* sem storage (navegação privada): a Hotline pode ligar de novo, sem problema */
  }
}

function recado(primeiro: PrazoCalculado): string {
  return `Aqui é a **Hotline**, linha direta do seu TCC. ${primeiro.titulo}: **${textoDias(primeiro.dias)}** (${dataCurta(primeiro.data)}). Os próximos estão logo abaixo.`;
}

/**
 * Lembrete de prazo: a Hotline "liga" quando algum prazo está a 14 dias ou menos.
 *
 * - Toca no máximo uma vez por dia (atendeu = não liga de novo hoje; "agora não" = só na próxima sessão).
 * - O toque (≈3,5 s) para ao atender, ao recusar ou ao desligar os sons (WCAG 1.4.2).
 * - Não rouba o foco: é um painel no canto, anunciado por uma região viva; o foco só entra quando a pessoa atende.
 * - Com "reduzir movimento", o telefone não treme; o som segue a preferência "Sons".
 * - Navegadores bloqueiam áudio antes do primeiro gesto: se a página abriu direto, o toque começa no primeiro clique ou tecla.
 * - Os prazos vêm do dossiê (API). Prazo já resolvido não gera ligação. `prazos` existe para os testes.
 */
export function ChamadaHotline({ hoje = AGORA, prazos: prazosFixos }: { hoje?: () => Date; prazos?: Prazo[] }) {
  const { pathname } = useLocation();
  const [estado, setEstado] = useState<Estado>('oculta');
  const [prazos, setPrazos] = useState<PrazoCalculado[]>([]); // os que motivaram a ligação
  const [agenda, setAgenda] = useState<PrazoCalculado[]>([]); // todos os prazos ainda relevantes, para quem atende
  const [tremendo, setTremendo] = useState(false);
  const [chamada, setChamada] = useState(0); // cada ligação nova reinicia o toque, mesmo se já estava tocando
  const [sons, alternarSons] = useSons();
  const pararToque = useRef<() => void>(() => {});
  const tituloAtendida = useRef<HTMLHeadingElement>(null);
  // Os prazos são da aluna: nada de ligação no Briefing nem no painel do orientador
  const foraDoApp = pathname === '/' || pathname.startsWith('/painel');

  /** Entrega os prazos do dossiê a `usar`. Sem resposta do servidor, simplesmente não liga. */
  const comPrazos = useCallback(
    (usar: (lista: Prazo[]) => void) => {
      if (prazosFixos) usar(prazosFixos);
      else
        obterDossie().then(
          (d) => usar(d.prazos),
          () => {},
        );
    },
    [prazosFixos],
  );

  const silenciar = useCallback(() => {
    pararToque.current();
    pararToque.current = () => {};
    setTremendo(false);
  }, []);

  const tocar = useCallback(
    (lista: PrazoCalculado[], todos: Prazo[]) => {
      if (lista.length === 0) return;
      setPrazos(lista);
      setAgenda(calcularPrazos(todos, hoje()).filter((p) => !p.concluido && p.dias >= -7));
      setTremendo(true);
      setChamada((n) => n + 1);
      setEstado('tocando');
    },
    [hoje],
  );

  // Ligação automática: uma vez, alguns segundos depois de abrir uma página do app (o Briefing fica de fora)
  useEffect(() => {
    if (foraDoApp) return;
    let vivo = true;
    const id = window.setTimeout(() => {
      const agora = hoje();
      if (ler(() => localStorage, CHAVE_ATENDIDA) === chaveDoDia(agora)) return;
      if (ler(() => sessionStorage, CHAVE_ADIADA) === '1') return;
      comPrazos((todos) => {
        if (vivo) tocar(prazosParaLigar(todos, agora), todos);
      });
    }, ATRASO_MS);
    return () => {
      vivo = false;
      window.clearTimeout(id);
    };
    // Só na primeira página do app: trocar de página não faz ligar de novo
  }, [foraDoApp, hoje, tocar, comPrazos]);

  // Ligação pedida pelo botão de demonstração (ignora "já atendeu hoje")
  useEffect(() => {
    const aoPedir = () => {
      silenciar();
      comPrazos((todos) => {
        // Na demonstração liga sempre: se nada estiver perto, mostra os próximos prazos em aberto (ou todos)
        const calculados = calcularPrazos(todos, hoje());
        const perto = prazosParaLigar(todos, hoje());
        const abertos = calculados.filter((p) => !p.concluido && p.dias >= 0);
        tocar(perto.length ? perto : abertos.length ? abertos : calculados, todos);
      });
    };
    window.addEventListener(EVENTO_LIGAR, aoPedir);
    return () => window.removeEventListener(EVENTO_LIGAR, aoPedir);
  }, [hoje, silenciar, tocar, comPrazos]);

  // Som e tremor enquanto está tocando
  useEffect(() => {
    if (estado !== 'tocando') return;
    const fimTremor = window.setTimeout(() => setTremendo(false), DURACAO_TELEFONE_MS);
    // Ao sair deste efeito (atendeu, recusou ou desligou os sons) o toque para na hora
    const parar = () => {
      window.clearTimeout(fimTremor);
      pararToque.current();
      pararToque.current = () => {};
    };
    if (!sons) return parar;

    let cancelado = false;
    let comecou = false;
    const comecar = () => {
      if (cancelado || comecou) return;
      comecou = true;
      pararToque.current = tocarTelefone();
    };
    // Se a pessoa já clicou em algo nesta página (ex.: veio do Briefing), o navegador já libera o áudio
    if (!obterAudio() && navigator.userActivation?.hasBeenActive) prepararSom();
    if (obterAudio() || navigator.userActivation?.hasBeenActive) {
      const id = window.setTimeout(() => (obterAudio() ? comecar() : undefined), 80); // resume() é assíncrono
      return () => {
        cancelado = true;
        window.clearTimeout(id);
        parar();
      };
    }
    // Página aberta direto: o navegador só libera o som no primeiro gesto
    let fimTremorGesto = 0;
    const noGesto = (e: Event) => {
      if (comecou) return;
      prepararSom();
      // Se o primeiro gesto já é "Atender" ou "Agora não", não faz sentido começar a tocar
      if (e.target instanceof Element && e.target.closest('.chamada')) return;
      window.setTimeout(comecar, 60);
      setTremendo(true);
      fimTremorGesto = window.setTimeout(() => setTremendo(false), DURACAO_TELEFONE_MS);
    };
    window.addEventListener('pointerdown', noGesto, { once: true });
    window.addEventListener('keydown', noGesto, { once: true });
    return () => {
      cancelado = true;
      parar();
      window.clearTimeout(fimTremorGesto);
      window.removeEventListener('pointerdown', noGesto);
      window.removeEventListener('keydown', noGesto);
    };
  }, [estado, sons, chamada]);

  useEffect(() => () => pararToque.current(), []);

  useEffect(() => {
    if (estado === 'atendida') tituloAtendida.current?.focus();
  }, [estado]);

  const atender = () => {
    silenciar();
    gravar(() => localStorage, CHAVE_ATENDIDA, chaveDoDia(hoje()));
    setEstado('atendida');
  };

  const agoraNao = () => {
    silenciar();
    gravar(() => sessionStorage, CHAVE_ADIADA, '1');
    setEstado('oculta');
  };

  const desligar = () => setEstado('oculta');

  const primeiro = prazos[0];
  const anuncio =
    estado === 'tocando' && primeiro
      ? `A Hotline está ligando: ${primeiro.titulo}, ${textoDias(primeiro.dias)}.`
      : '';

  return (
    <>
      {/* Região viva sempre presente: leitores de tela ouvem que a Hotline está ligando, sem perder o lugar */}
      <output className="visually-hidden">{anuncio}</output>

      {estado !== 'oculta' && primeiro && (
        <section
          className={`chamada chamada--${primeiro.urgencia}${tremendo ? ' chamada--tocando' : ''}`}
          aria-labelledby="titulo-chamada"
        >
          <div className="chamada__topo">
            <span className="chamada__icone">
              <TelefoneHotline />
            </span>
            <div className="stack" style={{ gap: 2 }}>
              <p className="label label--lantern">Hotline · linha direta</p>
              {estado === 'tocando' ? (
                <h2 id="titulo-chamada" className="chamada__titulo">
                  Chamada sobre o seu prazo
                </h2>
              ) : (
                <h2 id="titulo-chamada" className="chamada__titulo" ref={tituloAtendida} tabIndex={-1}>
                  Prazos do seu TCC
                </h2>
              )}
            </div>
          </div>

          {estado === 'tocando' ? (
            <>
              <p className="chamada__resumo">
                {primeiro.titulo} · <strong>{textoDias(primeiro.dias)}</strong>
              </p>
              <div className="linha" style={{ gap: 10 }}>
                <button type="button" className="btn btn-lantern botao chamada__botao" onClick={atender}>
                  Atender
                </button>
                <button type="button" className="btn btn-arquivo botao chamada__botao" onClick={agoraNao}>
                  Agora não
                </button>
                <button type="button" className="alternar-som" aria-pressed={sons} onClick={alternarSons}>
                  <span aria-hidden="true">{sons ? '♪' : '–'}</span> Sons
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="chamada__recado">
                <MaquinaDeEscrever texto={recado(primeiro)} som={sons} />
              </p>
              <ol className="chamada__prazos" aria-label="Próximos prazos">
                {agenda.map((p) => (
                  <li key={p.id} className={`chamada__prazo chamada__prazo--${p.urgencia}`}>
                    <span>{p.titulo}</span>
                    <span className="chamada__quando">
                      {dataCurta(p.data)} · {textoDias(p.dias)}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="linha" style={{ gap: 10 }}>
                <Link to="/dossie" className="btn btn-arquivo botao chamada__botao" onClick={desligar}>
                  Ver no dossiê
                </Link>
                <button type="button" className="btn btn-arquivo botao chamada__botao" onClick={desligar}>
                  Desligar
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
