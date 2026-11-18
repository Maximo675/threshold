import { Botao } from './Botao';

/**
 * O que a tela mostra enquanto os dados não chegaram: "acessando arquivo" ou o erro, com botão de tentar de novo.
 * Toda tela que lê da API usa este componente, para o carregamento e o erro terem sempre a mesma cara.
 */
export function EstadoDaTela({ titulo, erro, aoTentarDeNovo }: { titulo: string; erro: string | null; aoTentarDeNovo: () => void }) {
  return (
    <main className="stack estado-da-tela" aria-labelledby="titulo-estado">
      <h1 id="titulo-estado" className="display display--l">
        {titulo}
      </h1>
      {erro ? (
        <>
          <p className="erro" role="alert">
            {erro}
          </p>
          <div>
            <Botao onClick={aoTentarDeNovo}>Tentar de novo</Botao>
          </div>
        </>
      ) : (
        <p className="estado-da-tela__carregando">
          <span className="lampada-mini" aria-hidden="true" />
          Acessando o arquivo…
        </p>
      )}
    </main>
  );
}
