import { Link } from 'react-router';
import { Botao } from '../components/Botao';
import { Carimbo, Tarja } from '../components/Carimbo';
import { Desclassificar } from '../components/Desclassificar';
import { MarcaLimiar } from '../components/Logo';

/** As salas da plataforma, com o número de setor que aparece pintado ao fundo de cada uma. */
const SALAS = [
  ['01', 'Dossiê', '/dossie', 'Etapas, checklist, prazos e devolutivas'],
  ['02', 'Sala de Recorte', '/recorte', 'Do interesse amplo a um tema recortado'],
  ['03', 'Referências', '/referencias', 'Lista revisada pelo Archivist; DOI e ISBN'],
  ['04', 'Lantern', '/lantern', 'Conversa com a guia e seus especialistas'],
  ['05', 'Orientadores', '/orientadores', 'Fichas de afinidade e pedido de orientação'],
  ['06', 'Fortaleza', '/fortaleza', 'A proteção de dados, testada ao vivo'],
  ['07', 'Painel do orientador', '/painel', 'A visão do professor: pedidos e devolutivas'],
] as const;

const PILARES = [
  ['01', 'ABNT sem mistério', 'Cole uma referência e o Archivist aponta o que ajustar, citando a regra da norma.'],
  ['02', 'O próximo passo, sempre visível', 'Seu TCC vira um dossiê, e a Hotline diz em que etapa você está e o que fazer agora.'],
  ['03', 'O orientador certo para o seu tema', 'O Board mostra fichas de afinidade com áreas, estilo e vagas de cada professor.'],
];

/** Tela 1 — Briefing de primeiro acesso. */
export function Briefing() {
  return (
    <div className="page" data-setor="00">
      <div className="page__inner" style={{ gap: 56 }}>
        <header className="linha" style={{ justifyContent: 'space-between' }}>
          <span className="logo">
            <MarcaLimiar />
            <span className="logo__wordmark">THRESHOLD</span>
          </span>
          <div className="linha" style={{ gap: 20 }}>
            <p className="label">Briefing · etapa 1 de 4</p>
            <Link to="/dossie" className="muted" style={{ padding: '12px 4px' }}>
              Pular briefing
            </Link>
          </div>
        </header>

        <main className="row g-5 align-items-start">
          <section className="col-lg-8 coluna-principal" aria-labelledby="titulo-briefing">
            <p className="label">Arquivo de ingresso — protocolo TH-0001</p>
            <h1 id="titulo-briefing" className="display display--xl">
              <Desclassificar atraso={200}>
                Seu TCC tem um caminho. <span className="accent">A Lantern ilumina cada passo.</span>
              </Desclassificar>
            </h1>
            <p className="lead">
              O Threshold reúne normas ABNT, as etapas do trabalho e a escolha do orientador num só lugar. Este briefing
              leva 2 minutos e você pode voltar a ele quando quiser.
            </p>
            <div className="linha">
              <Botao para="/dossie">Começar o briefing →</Botao>
              <Botao para="/lantern" variante="secundario">
                Conversar com a Lantern
              </Botao>
            </div>
          </section>

          <div className="col-lg-4">
          <section className="card" aria-labelledby="titulo-pilares">
            <h2 id="titulo-pilares" className="label">
              O que você encontra aqui
            </h2>
            {PILARES.map(([numero, titulo, texto]) => (
              <div key={numero} className="linha" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                <span className="accent" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }} aria-hidden="true">
                  {numero}
                </span>
                <div>
                  <h3 style={{ fontSize: 18 }}>{titulo}</h3>
                  <p className="muted" style={{ margin: 0, fontSize: 15 }}>
                    {texto}
                  </p>
                </div>
              </div>
            ))}
          </section>
          </div>
        </main>

        <nav className="stack" aria-labelledby="titulo-mapa">
          <h2 id="titulo-mapa" className="label label--lantern">
            Mapa do arquivo
          </h2>
          {/* Grade do Bootstrap: 1 coluna no celular, 2 no tablet, 4 no computador */}
          <ul className="mapa row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 list-unstyled">
            {SALAS.map(([setor, nome, para, resumo]) => (
              <li key={setor} className="col">
                <Link to={para} className="mapa__sala">
                  <span className="mapa__setor" aria-hidden="true">
                    {setor}
                  </span>
                  <span className="mapa__nome">{nome}</span>
                  <span className="mapa__resumo">{resumo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* flexDirection 'row' explícito: .card é coluna, e em coluna o flex-basis viraria altura */}
        <section className="card card--tracejado linha" style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 32 }} aria-labelledby="titulo-privacidade">
          <div style={{ flex: '999 1 420px' }}>
            <h2 id="titulo-privacidade" style={{ fontSize: 22 }}>
              <Desclassificar atraso={900}>Seus dados ficam tarjados.</Desclassificar>
            </h2>
            <p className="muted" style={{ marginBottom: 0 }}>
              Coletamos só o necessário: nome, e-mail institucional, curso e período. Nada de CPF. Seu nome nunca é enviado
              para a IA, e você pode exportar ou apagar seus dados quando quiser.
            </p>
          </div>
          <div className="stack" style={{ flex: '1 1 280px', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
            <span>
              <span className="muted">NOME </span>
              <Tarja largura={150} rotulo="nome protegido" />
            </span>
            <span>
              <span className="muted">CÓDIGO </span>ALUNO_7F3A
            </span>
            <span>
              <Carimbo tom="alerta">Confidencial</Carimbo>
            </span>
          </div>
        </section>

        <footer className="rodape">PROTÓTIPO · DADOS FICTÍCIOS</footer>
      </div>
    </div>
  );
}
