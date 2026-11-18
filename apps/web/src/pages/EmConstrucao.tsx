import { Botao } from '../components/Botao';
import { Cabecalho } from '../components/Cabecalho';
import { Carimbo } from '../components/Carimbo';

/** Página provisória para telas que já existem no Figma mas ainda não foram codadas. */
export function EmConstrucao({ titulo }: { titulo: string }) {
  return (
    <div className="page" data-setor="--">
      <div className="page__inner">
        <Cabecalho />
        <main className="stack" style={{ gap: 20 }}>
          <Carimbo tom="andamento">Em construção</Carimbo>
          <h1 className="display display--l">{titulo}</h1>
          <p className="muted" style={{ margin: 0 }}>
            Esta tela já está desenhada no Figma e entra no código nas próximas semanas.
          </p>
          <div>
            <Botao para="/dossie" variante="secundario">
              Voltar ao dossiê
            </Botao>
          </div>
        </main>
      </div>
    </div>
  );
}
