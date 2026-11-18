/**
 * Fluxo da aluna contra a plataforma inteira (API de verdade servindo o site; ver scripts/servidor-e2e.mjs).
 * Cada teste começa com a demonstração reiniciada. As telas também passam pela checagem automática de
 * acessibilidade (axe-core, regras WCAG 2.x A e AA).
 */
const WCAG_AA = { runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } };

describe('Fluxo da aluna', () => {
  beforeEach(() => {
    cy.request('POST', '/api/demo/reiniciar');
  });

  it('briefing mostra o mapa das salas, leva ao dossiê e passa na checagem de acessibilidade', () => {
    cy.visit('/');
    cy.wait(1200); // espera as tarjas do título se abrirem (texto coberto confundiria a checagem de contraste)
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG_AA);
    cy.title().should('eq', 'Briefing · Threshold');
    cy.get('nav[aria-labelledby="titulo-mapa"] a').should('have.length', 7);
    cy.contains('a', 'Começar o briefing').click();
    cy.location('pathname').should('eq', '/dossie');
  });

  it('dossiê lê da API, salva o checklist e aponta o próximo passo', () => {
    cy.visit('/dossie');
    cy.wait(1800); // tarja do título + carimbos batendo
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG_AA);
    cy.get('[role="progressbar"][aria-label="Progresso do TCC"]').should('have.attr', 'aria-valuenow', '1').and('have.attr', 'aria-valuemax', '6');
    cy.get('[aria-current="step"]').should('contain.text', 'Escolha do orientador');
    cy.contains('label', 'Ler as fichas de pelo menos dois orientadores').click();
    cy.contains('Checklist · 1 de 3');
    cy.reload(); // o que foi marcado ficou salvo no servidor
    cy.contains('Checklist · 1 de 3');
    cy.contains('a', 'Ver orientadores').first().click();
    cy.location('pathname').should('eq', '/orientadores');
  });

  it('pedido de orientação de ponta a ponta: aluna pede, orientador aceita e manda devolutiva, dossiê avança', () => {
    cy.visit('/orientadores');
    cy.wait(1500); // tarja do nome + carimbo
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG_AA);
    cy.get('h1').should('contain.text', 'Ricardo Almeida');
    cy.contains('Não existe ranking de professores');
    cy.contains('button', 'Solicitar orientação').click();
    cy.get('output').should('contain.text', 'recebeu o seu pedido');

    cy.contains('a', 'Ver como orientador (demo)').click();
    cy.location('pathname').should('eq', '/painel/ricardo-almeida');
    cy.title().should('eq', 'Painel do orientador · Threshold');
    cy.contains('h3', 'Ana Souza');
    cy.wait(1200);
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG_AA);
    cy.contains('button', 'Aceitar orientação').click();
    cy.get('output').should('contain.text', 'Você aceitou orientar Ana Souza');
    cy.get('#devolutiva').type('Bom tema. Comece pelo recorte.');
    cy.contains('button', 'Enviar devolutiva').click();
    cy.get('output').should('contain.text', 'Devolutiva enviada');

    cy.contains('a', 'Ver como aluna').click();
    cy.location('pathname').should('eq', '/dossie');
    cy.get('[role="progressbar"][aria-label="Progresso do TCC"]').should('have.attr', 'aria-valuenow', '2');
    cy.get('[aria-current="step"]').should('contain.text', 'Projeto de pesquisa');
    cy.contains('Bom tema. Comece pelo recorte.');
    cy.contains('button', 'Enviar etapa ao orientador').should('be.disabled');
  });

  it('troca de ficha e leva a pergunta pronta ao Board', () => {
    cy.visit('/orientadores');
    cy.contains('a', 'Profa. Helena Costa').click();
    cy.location('pathname').should('eq', '/orientadores/helena-costa');
    cy.title().should('eq', 'Orientadores · Threshold');
    cy.get('h1').should('have.focus');
    cy.contains('a', 'Perguntar ao Board').click();
    cy.location('pathname').should('eq', '/lantern');
    cy.get('#mensagem').should('have.value', 'Que orientador combina com o meu tema?');
  });

  it('Hotline: simular ligação, atender e ver os prazos', () => {
    cy.visit('/dossie');
    cy.contains('h2', 'Prazos').should('be.visible');
    cy.contains('button', 'Simular ligação da Hotline').click();
    cy.contains('h2', 'Chamada sobre o seu prazo').should('be.visible');
    cy.contains('button', 'Atender').click();
    cy.contains('h2', 'Prazos do seu TCC').should('have.focus');
    cy.wait(800);
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG_AA);
    cy.contains('button', 'Desligar').click();
    cy.contains('h2', 'Prazos do seu TCC').should('not.exist');
  });

  it('no celular, o menu do Bootstrap se recolhe num botão e abre com um toque', () => {
    cy.viewport(390, 844);
    cy.visit('/dossie');
    cy.get('nav[aria-label="Principal"]').should('not.be.visible');
    cy.get('button[aria-label="Abrir ou fechar o menu"]').should('have.attr', 'aria-expanded', 'false').click();
    cy.get('button[aria-label="Abrir ou fechar o menu"]').should('have.attr', 'aria-expanded', 'true');
    cy.get('nav[aria-label="Principal"] a').contains('Referências').should('be.visible').click();
    cy.location('pathname').should('eq', '/referencias');
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG_AA);
  });

  it('reiniciar a demonstração pergunta antes, num modal acessível', () => {
    cy.visit('/dossie');
    cy.contains('button', 'Reiniciar a demonstração').click();
    cy.get('[role="dialog"]').should('be.visible').within(() => {
      cy.contains('h2', 'Reiniciar a demonstração?');
      cy.contains('button', 'Cancelar').should('have.focus');
    });
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG_AA);
    cy.get('body').type('{esc}');
    cy.get('[role="dialog"]').should('not.exist');
    cy.contains('button', 'Reiniciar a demonstração').should('have.focus');
  });

  it('dá para navegar pelo cabeçalho só com o teclado', () => {
    cy.visit('/dossie');
    cy.get('nav[aria-label="Principal"] a').contains('Lantern').focus().type('{enter}');
    cy.location('pathname').should('eq', '/lantern');
    cy.get('nav[aria-label="Principal"] a[aria-current="page"]').should('have.text', 'Lantern');
  });
});
