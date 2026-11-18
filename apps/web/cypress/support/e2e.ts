// Comandos de acessibilidade: cy.injectAxe() e cy.checkA11y() (axe-core).
import 'cypress-axe';

/*
 * Nos testes, a abertura "acessando arquivo" já conta como vista (é decorativa e só atrasaria cada teste)
 * e a ligação automática da Hotline fica adiada. As duas são testadas no Vitest e na checagem manual.
 */
beforeEach(() => {
  cy.on('window:before:load', (win) => {
    try {
      win.sessionStorage.setItem('threshold:abertura-vista', '1');
      // A ligação automática da Hotline depende da data de hoje; nos testes ela só toca quando pedida
      win.sessionStorage.setItem('threshold:hotline-adiada', '1');
    } catch {
      /* sem storage: a abertura aparece e some sozinha em ~2 s */
    }
  });
});
