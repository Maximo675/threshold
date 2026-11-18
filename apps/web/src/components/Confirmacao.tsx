import { useId, type ReactNode } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useMenosMovimento } from '../hooks/useMenosMovimento';

interface ConfirmacaoProps {
  aberta: boolean;
  titulo: string;
  children: ReactNode;
  /** Texto do botão que confirma (ex.: "Reiniciar"). */
  confirmar: string;
  cancelar?: string;
  aoConfirmar: () => void;
  aoFechar: () => void;
}

/**
 * Pergunta antes de uma ação que desfaz trabalho (heurística de Nielsen: prevenção de erros).
 *
 * É o Modal do React-Bootstrap: ele já cuida da acessibilidade (role="dialog", foco preso dentro da janela,
 * Esc fecha, o foco volta para o botão que abriu). O foco começa em "Cancelar", a opção segura.
 * Com "reduzir movimento" no sistema, a janela aparece sem animação.
 */
export function Confirmacao({ aberta, titulo, children, confirmar, cancelar = 'Cancelar', aoConfirmar, aoFechar }: ConfirmacaoProps) {
  const idTitulo = useId();
  const menosMovimento = useMenosMovimento();
  return (
    <Modal show={aberta} onHide={aoFechar} centered aria-labelledby={idTitulo} animation={!menosMovimento}>
      <Modal.Header closeButton closeLabel="Fechar">
        <Modal.Title id={idTitulo} as="h2">
          {titulo}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        {/* autoFocus: o foco cai na opção que não desfaz nada */}
        {/* oxlint-disable-next-line jsx-a11y/no-autofocus */}
        <button type="button" className="btn btn-arquivo botao" onClick={aoFechar} autoFocus>
          {cancelar}
        </button>
        <button type="button" className="btn btn-alerta botao" onClick={aoConfirmar}>
          {confirmar}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
