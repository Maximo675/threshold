import { useCallback, useState, type FormEvent } from 'react';
import { mensagemDeErro, obterRelatorio, tarjar, type Tarjado, type Verificacao } from '../api/threshold';
import { Botao } from '../components/Botao';
import { Cabecalho } from '../components/Cabecalho';
import { Carimbo } from '../components/Carimbo';
import { Desclassificar } from '../components/Desclassificar';
import { EstadoDaTela } from '../components/EstadoDaTela';
import { useRecurso } from '../hooks/useRecurso';

const EXEMPLO =
  'Oi, sou a Ana Souza, do 7º período. Meu e-mail é ana.souza@exemplo.edu, meu CPF é 123.456.789-09 e meu telefone é (41) 99999-0000. Quero saber se o Ricardo Almeida combina com o meu tema.';

const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function resumoDaTarja(t: Tarjado): string {
  if (t.substituicoes === 0) return 'Nenhum dado pessoal encontrado: o texto seguiria como está.';
  const r = t.resumo;
  return [
    r.pessoas > 0 && plural(r.pessoas, 'nome virou código', 'nomes viraram códigos'),
    r.emails > 0 && plural(r.emails, 'e-mail virou código', 'e-mails viraram códigos'),
    r.cpfs > 0 && plural(r.cpfs, 'CPF removido', 'CPFs removidos'),
    r.telefones > 0 && plural(r.telefones, 'telefone removido', 'telefones removidos'),
  ]
    .filter(Boolean)
    .join(' · ');
}

function ListaDeVerificacoes({ itens }: { itens: Verificacao[] }) {
  return (
    <ul className="verificacoes">
      {itens.map((v, i) => (
        <li key={v.id} className={`verificacao${v.ok ? '' : ' verificacao--falhou'}`} data-verificacao={v.id}>
          <div className="verificacao__topo">
            <span className="verificacao__texto">
              <span className="verificacao__camada">{v.camada}</span>
              <span className="verificacao__titulo">{v.titulo}</span>
            </span>
            <Carimbo tom={v.ok ? 'aprovado' : 'alerta'} atraso={150 + i * 110}>
              {v.ok ? 'Aprovado' : 'Falhou'}
            </Carimbo>
          </div>
          <details>
            <summary>Como testamos</summary>
            <p>{v.comoTestamos}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}

/**
 * Tela — Fortaleza: a proteção de dados mostrada funcionando, em vez de só prometida.
 * 1. Teste a tarja: a pessoa escreve e vê o que a IA receberia (nada é enviado à IA nem guardado).
 * 2. Verificações ao vivo: o servidor roda os testes de proteção na hora, e o navegador confere os cabeçalhos.
 * 3. Contadores da sessão, configuração e o que ainda falta antes de usar dados reais.
 */
export function Fortaleza() {
  const buscar = useCallback(() => obterRelatorio(), []);
  const { dados, erro, recarregar, definir } = useRecurso(buscar);
  const [rodando, setRodando] = useState(false);
  const [avisoRelatorio, setAvisoRelatorio] = useState('');

  const [texto, setTexto] = useState('');
  const [tarjando, setTarjando] = useState(false);
  const [resultado, setResultado] = useState<{ original: string; tarjado: Tarjado } | null>(null);
  const [erroTarja, setErroTarja] = useState<string | null>(null);

  async function aoTarjar(e: FormEvent) {
    e.preventDefault();
    const original = texto.trim();
    if (!original || tarjando) return;
    setErroTarja(null);
    setTarjando(true);
    try {
      setResultado({ original, tarjado: await tarjar(original) });
    } catch (falha) {
      setErroTarja(mensagemDeErro(falha));
    } finally {
      setTarjando(false);
    }
  }

  async function rodarDeNovo() {
    setRodando(true);
    setAvisoRelatorio('');
    try {
      const novo = await obterRelatorio();
      definir(novo);
      setAvisoRelatorio(`Verificações refeitas às ${hora(novo.relatorio.geradoEm)}.`);
    } catch (falha) {
      setAvisoRelatorio(mensagemDeErro(falha));
    } finally {
      setRodando(false);
    }
  }

  if (!dados) {
    return (
      <div className="page" data-setor="06">
        <div className="page__inner">
          <Cabecalho />
          <EstadoDaTela titulo="Fortaleza" erro={erro} aoTentarDeNovo={recarregar} />
        </div>
      </div>
    );
  }

  const { relatorio, cabecalhos } = dados;
  const todas = [...relatorio.verificacoes, ...cabecalhos];
  const aprovadas = todas.filter((v) => v.ok).length;
  const { contadores: c, configuracao: cfg } = relatorio;

  return (
    <div className="page" data-setor="06">
      <div className="page__inner">
        <Cabecalho />

        <section className="stack" aria-labelledby="titulo-fortaleza">
          <p className="label label--lantern">Fortaleza · relatório de proteção</p>
          <h1 id="titulo-fortaleza" className="display display--l">
            <Desclassificar atraso={150}>Seus dados ficam tarjados</Desclassificar>
          </h1>
          <p className="soft" style={{ margin: 0, maxWidth: 760 }}>
            Proteção de dados pesou na decisão de todos que responderam à nossa pesquisa, alunos e professores. Esta sala
            mostra a proteção funcionando: você testa a tarja, e as verificações rodam na hora, no servidor e no seu
            navegador.
          </p>
        </section>

        <div className="row g-4 align-items-start">
          <main className="col-lg-8 coluna-principal">
            <section className="stack" aria-labelledby="titulo-tarja">
              <h2 id="titulo-tarja" className="label">
                Teste a tarja
              </h2>
              <form className="formulario-conversa" onSubmit={aoTarjar}>
                <label htmlFor="texto-tarja" className="visually-hidden">
                  Texto para tarjar
                </label>
                <textarea
                  id="texto-tarja"
                  className="form-control"
                  rows={4}
                  maxLength={2000}
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escreva um texto com nome, e-mail, CPF ou telefone"
                  aria-describedby="dica-tarja"
                />
                <span id="dica-tarja" className="muted" style={{ fontSize: 13 }}>
                  Nada do que você escrever aqui vai para a IA nem fica guardado. A tarja reconhece quem está cadastrado
                  (nesta demonstração: Ana Souza e os três professores), além de qualquer e-mail, CPF e telefone.
                </span>
                <div className="linha">
                  <button type="submit" className="btn btn-lantern botao" disabled={!texto.trim() || tarjando}>
                    {tarjando ? 'Tarjando…' : 'Aplicar a tarja'}
                  </button>
                  <Botao variante="secundario" onClick={() => setTexto(EXEMPLO)}>
                    Usar o exemplo
                  </Botao>
                </div>
              </form>
              {erroTarja && (
                <p className="erro" role="alert">
                  {erroTarja}
                </p>
              )}
              {/* Região viva sempre presente: o leitor de tela ouve o resumo assim que a tarja é aplicada */}
              <output className="visually-hidden">{resultado ? `Tarja aplicada. ${resumoDaTarja(resultado.tarjado)}` : ''}</output>
              {resultado && (
                <div className="tarjado">
                  <div className="tarjado__lado">
                    <span className="label">Você escreveu</span>
                    <pre className="enviado-ia">{resultado.original}</pre>
                  </div>
                  <div className="tarjado__lado">
                    <span className="label label--lantern">A IA receberia</span>
                    <pre className="enviado-ia enviado-ia--destaque">{resultado.tarjado.protegido}</pre>
                  </div>
                  <p className="tarjado__resumo">
                    {resumoDaTarja(resultado.tarjado)}
                  </p>
                </div>
              )}
            </section>

            <section className="stack" aria-labelledby="titulo-verificacoes">
              <div className="linha" style={{ justifyContent: 'space-between' }}>
                <h2 id="titulo-verificacoes" className="label">
                  Verificações ao vivo
                </h2>
                <Botao variante="secundario" disabled={rodando} onClick={() => void rodarDeNovo()}>
                  {rodando ? 'Rodando…' : 'Rodar de novo'}
                </Botao>
              </div>
              <p className={`placar${aprovadas === todas.length ? '' : ' placar--falhou'}`}>
                <strong>
                  {aprovadas} de {todas.length}
                </strong>{' '}
                verificações aprovadas
                <span className="muted"> · às {hora(relatorio.geradoEm)}</span>
              </p>
              <output className="saida-acao">{avisoRelatorio}</output>
              <h3 className="label">No servidor</h3>
              <ListaDeVerificacoes itens={relatorio.verificacoes} />
              <h3 className="label">No seu navegador</h3>
              <ListaDeVerificacoes itens={cabecalhos} />
            </section>
          </main>

          <aside className="col-lg-4 coluna-lateral" aria-label="Sessão e configuração">
            <section className="card" aria-labelledby="titulo-sessao">
              <h2 id="titulo-sessao" style={{ fontSize: 18 }}>
                Nesta sessão
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                Desde que o servidor subiu, às {hora(c.desde)}. Só números: nenhum texto fica guardado.
              </p>
              <dl className="numeros numeros--compactos">
                <div className="numero">
                  <dt>Envios à IA</dt>
                  <dd>{c.enviosParaIA}</dd>
                </div>
                <div className="numero numero--lantern">
                  <dt>Trechos tarjados</dt>
                  <dd>{c.trechosProtegidos}</dd>
                </div>
                <div className="numero">
                  <dt>Manipulações barradas</dt>
                  <dd>{c.etiquetasNeutralizadas}</dd>
                </div>
                <div className="numero">
                  <dt>Bloqueios por excesso</dt>
                  <dd>{c.bloqueiosPorLimite}</dd>
                </div>
                <div className="numero">
                  <dt>Entradas recusadas</dt>
                  <dd>{c.entradasRecusadas}</dd>
                </div>
                <div className="numero">
                  <dt>Consultas públicas</dt>
                  <dd>{c.consultasExternas}</dd>
                </div>
              </dl>
            </section>

            <section className="card" aria-labelledby="titulo-config">
              <h2 id="titulo-config" style={{ fontSize: 18 }}>
                Como o servidor está configurado
              </h2>
              <dl className="config">
                <dt>IA</dt>
                <dd>{cfg.iaConfigurada ? `Ligada (${cfg.provedor}). A chave fica só no servidor.` : 'Desligada. Nenhum texto sai do servidor.'}</dd>
                <dt>Mensagens à IA</dt>
                <dd>até {cfg.limiteIaPorMinuto} por minuto, com no máximo {cfg.tempoMaximoIaSegundos} s de espera</dd>
                <dt>Requisições</dt>
                <dd>até {cfg.limiteGeralPorMinuto} por minuto por pessoa</dd>
                <dt>Tamanho</dt>
                <dd>até {cfg.corpoMaximoKb} kB por envio</dd>
                <dt>Base ABNT</dt>
                <dd>{cfg.regrasAbnt} regras conferidas pela equipe</dd>
              </dl>
            </section>

            <section className="card card--tracejado" aria-labelledby="titulo-pendencias">
              <h2 id="titulo-pendencias" style={{ fontSize: 18 }}>
                O que falta antes de usar dados reais
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                Este é um protótipo com dados fictícios. Uma fortaleza honesta mostra também o que ainda não construiu.
              </p>
              <ul className="avisos">
                {relatorio.pendencias.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>

        <footer className="rodape">PROTÓTIPO · DADOS FICTÍCIOS · VERIFICAÇÕES EXECUTADAS NA HORA</footer>
      </div>
    </div>
  );
}
