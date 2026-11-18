import type { ReactNode } from 'react';
import type { EtapaDossie } from '../api/threshold';
import { Carimbo, Tarja } from './Carimbo';

interface Props {
  etapa: EtapaDossie;
  /** Uma ação está em andamento: novos cliques no checklist são ignorados até o servidor responder. */
  ocupado?: boolean;
  aoMarcar?: (id: string, feito: boolean) => void;
  /** Texto do lado direito das etapas bloqueadas (ex.: "CLASSIFICADO · LIBERA NA ETAPA 02"). */
  status?: string;
  /** Ações da etapa (botões), mostradas abaixo do checklist. */
  children?: ReactNode;
}

/** Linha de etapa do dossiê (componente "Etapa" no Figma), com o checklist da etapa em andamento. */
export function Etapa({ etapa, ocupado = false, aoMarcar, status, children }: Props) {
  const { numero, titulo, estado, descricao, checklist } = etapa;
  const numeroTexto = String(numero).padStart(2, '0');
  // Os carimbos batem em sequência, de cima para baixo, depois que o título se revela
  const atraso = 500 + numero * 160;
  const aberta = estado === 'atual' || estado === 'em-revisao';
  const feitos = checklist.filter((i) => i.feito).length;

  return (
    <li className={`etapa etapa--${estado}`} aria-current={aberta ? 'step' : undefined}>
      <span className="etapa__numero" aria-hidden="true">
        {numeroTexto}
      </span>
      <div className="etapa__conteudo">
        <span className="etapa__titulo">
          <span className="visually-hidden">Etapa {numero}: </span>
          {titulo}
        </span>
        {estado === 'classificado' ? (
          <span>
            <Tarja largura={220} bloqueado rotulo="Detalhes liberados quando a etapa anterior for concluída." />
          </span>
        ) : (
          descricao && <p className="etapa__descricao">{descricao}</p>
        )}
      </div>
      {estado === 'aprovado' && (
        <Carimbo tom="aprovado" atraso={atraso}>
          Aprovado
        </Carimbo>
      )}
      {estado === 'atual' && (
        <Carimbo tom="andamento" atraso={atraso}>
          Em andamento
        </Carimbo>
      )}
      {estado === 'em-revisao' && (
        <Carimbo tom="alerta" atraso={atraso}>
          Em revisão
        </Carimbo>
      )}
      {estado === 'classificado' && <span className="etapa__status">{status ?? 'CLASSIFICADO'}</span>}

      {aberta && (
        <div className="etapa__detalhe">
          <p className="label" id={`checklist-${numero}`}>
            Checklist · {feitos} de {checklist.length}
          </p>
          <ul className="checklist" aria-labelledby={`checklist-${numero}`}>
            {checklist.map((item) => (
              <li key={item.id}>
                <label className="checklist__item">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={item.feito}
                    disabled={estado !== 'atual' || item.automatico}
                    // Enquanto o servidor responde, o clique é ignorado em vez de desabilitar o campo:
                    // desabilitar tiraria o foco de quem navega pelo teclado.
                    onChange={(e) => {
                      if (!ocupado) aoMarcar?.(item.id, e.target.checked);
                    }}
                  />
                  <span>
                    {item.texto}
                    {item.automatico && <span className="muted"> (marca sozinho)</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {children && <div className="linha etapa__acoes">{children}</div>}
        </div>
      )}
    </li>
  );
}
