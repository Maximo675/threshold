# Como contribuir com o Threshold

## Fluxo de trabalho

1. Crie uma branch a partir da `main`: `tipo/descricao-curta` (ex.: `feat/revisor-abnt`, `fix/cabecalho-mobile`, `docs/kit-validacao`).
2. Faça commits pequenos no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português:
   - `feat: revisor ABNT valida edição`
   - `fix: quadro de privacidade no celular`
   - `test: casos de e-mail na pseudonimização`
   - `docs: atualiza documento de visão`
3. Abra um pull request e peça revisão de outra pessoa da equipe. O CI precisa passar.

## Checklist do pull request

- [ ] Testes novos ou atualizados para o que mudou
- [ ] `npm run lint`, `npm run typecheck` e `npm test` passando
- [ ] Telas novas conferidas com teclado e no celular (390 px); `npm run e2e` sem violações de acessibilidade
- [ ] Nenhum dado real, segredo ou `.env` no commit (veja [SECURITY.md](SECURITY.md))
- [ ] Textos de interface claros e calorosos; o tema visual nunca no lugar da instrução
- [ ] Documentação atualizada (README, `docs/`) se o comportamento mudou

## Design

O Figma é a fonte da verdade do visual: [Threshold — Protótipo de telas](https://www.figma.com/design/RnBE9rMJzfdctWnUTZ7tBd). Cores e tipografia do código estão em `apps/web/src/styles/tokens.css` e devem bater com as variáveis da página "Fundação".

A interface usa o **Bootstrap 5.3** (exigência da A3 de Usabilidade). Use as classes e os componentes dele (grade, `btn`, `form-control`, `card`, `Modal` do React-Bootstrap) e mude as cores pelas variáveis em `apps/web/src/styles/bootstrap-tema.css`, nunca com cores soltas no componente.

## Base ABNT

Regras e casos de teste da Lantern ficam em `data/abnt/`. Antes de adicionar algo, leia [docs/abnt/README.md](docs/abnt/README.md): regras com nossas palavras e exemplos inventados, nunca texto copiado da norma.
