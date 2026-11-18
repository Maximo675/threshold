/**
 * Referências e Fortaleza contra a API de verdade. Só o que depende de IA ou de internet é simulado
 * (cy.intercept): a revisão do Archivist e a consulta à Crossref.
 */
const WCAG_AA = { runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } };

describe('Referências', () => {
  it('revisa a lista em lote e monta uma referência pelo DOI', () => {
    cy.intercept('GET', '/api/lantern/status', { online: true });
    cy.intercept('POST', '/api/referencias/revisar', {
      body: {
        itens: [
          { n: 1, original: 'souza, marina. Métodos. 2 ed. Curitiba: Editora Exemplo, 2021.', situacao: 'corrigir', problemas: [{ regra: 'REF-AUTOR-01', titulo: 'Sobrenome do autor em maiúsculas, prenome depois', explicacao: 'O sobrenome vai em maiúsculas.' }], corrigida: 'SOUZA, Marina. **Métodos**. 2. ed. Curitiba: Editora Exemplo, 2021.' },
          { n: 2, original: 'LIMA, Ana. **Guia**. São Paulo: Editora Exemplo, 2019.', situacao: 'ok', problemas: [], corrigida: 'LIMA, Ana. **Guia**. São Paulo: Editora Exemplo, 2019.' },
        ],
        resumo: { total: 2, aprovadas: 1, corrigir: 1, semResposta: 0 },
        protecao: { substituicoes: 0 },
      },
    }).as('revisar');
    cy.intercept('GET', '/api/referencias/doi*', {
      body: { referencia: 'BARROS, Júlia. Leitura em telas. **Revista Exemplo**, [S. l.], maio 2025. DOI: 10.99999/x.', tipo: 'artigo', avisos: ['A base não informa a cidade de publicação: usei [S. l.].'], fonte: 'Crossref', identificador: '10.99999/x' },
    });

    cy.visit('/referencias');
    cy.title().should('eq', 'Referências · Threshold');
    cy.contains('button', 'Usar a lista de exemplo').click();
    cy.contains('4 referências encontradas');
    cy.contains('button', 'Revisar com o Archivist').click();
    cy.wait('@revisar');
    cy.contains('h2', 'Resultado: 1 aprovada · 1 para corrigir').should('have.focus');
    cy.contains('.revisada', 'REF-AUTOR-01').should('contain.text', 'Corrigir').find('strong').should('contain.text', 'Métodos');

    cy.get('#codigo').type('10.99999/x');
    cy.contains('button', 'Montar a referência').click();
    cy.contains('Montada com dados da Crossref');
    cy.contains('button', 'Adicionar à lista').click();
    cy.get('#lista').invoke('val').should('contain', 'BARROS, Júlia');

    cy.wait(1200);
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG_AA);
  });

  it('DOI e ISBN inválidos são recusados pelo servidor de verdade, sem sair para a internet', () => {
    cy.visit('/referencias');
    cy.get('#codigo').type('http://exemplo.interno/segredo');
    cy.contains('button', 'Montar a referência').click();
    cy.get('[role="alert"]').should('contain.text', 'não parece um DOI');
    cy.contains('label', 'ISBN (livro)').click();
    cy.get('#codigo').clear().type('9788545702871');
    cy.contains('button', 'Montar a referência').click();
    cy.get('[role="alert"]').should('contain.text', 'ISBN inválido');
  });
});

describe('Fortaleza', () => {
  it('todas as verificações passam no servidor e no navegador, e a tarja funciona ao vivo', () => {
    cy.visit('/fortaleza');
    cy.title().should('eq', 'Fortaleza · Threshold');
    cy.get('.verificacao').should('have.length', 12);
    // O Cypress roda o site dentro de uma moldura (iframe) e, para isso, retira da resposta os cabeçalhos
    // Content-Security-Policy e X-Frame-Options. Então, só aqui, essas duas verificações do navegador aparecem
    // como falha. Num navegador de verdade as 12 passam, e os dois cabeçalhos são testados na API (app.test.ts).
    const RETIRADOS_PELO_CYPRESS = ['csp', 'moldura'];
    cy.get('.verificacao--falhou').each(($item) => {
      expect(RETIRADOS_PELO_CYPRESS).to.include($item.attr('data-verificacao'));
    });
    cy.get('.verificacao--falhou').should('have.length.at.most', 2);
    cy.contains('.placar', 'de 12');

    cy.contains('button', 'Usar o exemplo').click();
    cy.contains('button', 'Aplicar a tarja').click();
    cy.get('.enviado-ia--destaque')
      .should('contain.text', 'ALUNO_')
      .and('contain.text', '[CPF REMOVIDO]')
      .and('not.contain.text', 'Ana Souza')
      .and('not.contain.text', 'ana.souza@exemplo.edu');
    cy.contains('2 nomes viraram códigos');

    cy.wait(1500); // carimbos
    cy.injectAxe();
    cy.checkA11y(undefined, WCAG_AA);
  });

  it('o botão "Efeitos de luz" desliga a luz que segue o cursor e fica lembrado', () => {
    cy.visit('/fortaleza');
    cy.contains('button', 'Efeitos de luz').should('have.attr', 'aria-pressed', 'true').click().should('have.attr', 'aria-pressed', 'false');
    cy.get('html').should('have.attr', 'data-efeitos', 'desligado');
    cy.reload();
    cy.contains('button', 'Efeitos de luz').should('have.attr', 'aria-pressed', 'false');
  });
});
