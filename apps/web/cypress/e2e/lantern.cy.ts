/**
 * Demo da Lantern. A API é interceptada (cy.intercept): o teste não gasta créditos de IA
 * e funciona sem chave. A conversa de verdade é testada à mão (docs/05-como-rodar-e-testar.md).
 */
const WCAG_AA = { runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } };

describe('Lantern', () => {
  it('conversa: sugestão → resposta do Archivist → painel de proteção', () => {
    cy.intercept('GET', '/api/lantern/status', { online: true });
    cy.intercept('POST', '/api/lantern/mensagens', {
      delay: 300,
      body: {
        agente: 'archivist',
        nomeAgente: 'Archivist',
        texto: 'O sobrenome do autor vai em **maiúsculas** [ABNT-AUTOR-01].\nComo fica: SOUZA, Marina.',
        protecao: { enviadoAIA: 'Revise esta referência: PESSOA_9c8b7a. Métodos de pesquisa…', substituicoes: 1 },
      },
    }).as('mensagem');

    cy.visit('/lantern');
    cy.title().should('eq', 'Lantern · Threshold');
    cy.contains('button', 'Revise esta referência').click();
    cy.contains('A Lantern está consultando o arquivo').should('be.visible');
    cy.wait('@mensagem').its('request.body.mensagens').should('have.length', 1);

    cy.contains('.mensagem--lantern', 'via Archivist').should('contain.text', 'SOUZA, Marina');
    cy.get('[aria-label="Texto enviado à IA"]').should('contain.text', 'PESSOA_9c8b7a');

    cy.wait(1500); // máquina de escrever termina
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG_AA);
  });

  it('sem IA configurada, explica como ligar e não deixa enviar', () => {
    cy.intercept('GET', '/api/lantern/status', { online: false });
    cy.visit('/lantern');
    cy.contains('A Lantern está offline').should('be.visible');
    cy.contains('button', 'Enviar à Lantern').should('be.disabled');
  });

  it('erro da IA vira alerta e o texto volta para o campo', () => {
    cy.intercept('GET', '/api/lantern/status', { online: true });
    cy.intercept('POST', '/api/lantern/mensagens', {
      statusCode: 502,
      body: { erro: 'A Lantern não conseguiu falar com a IA agora. Tente de novo em instantes.', codigo: 'IA_INDISPONIVEL' },
    });
    cy.visit('/lantern');
    cy.get('#mensagem').type('Qual é o meu prazo?{enter}');
    cy.get('[role="alert"]').should('contain.text', 'não conseguiu');
    cy.get('#mensagem').should('have.value', 'Qual é o meu prazo?');
  });
});
