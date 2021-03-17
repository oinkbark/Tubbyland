import vars from '../fixtures/vars'

context('TheFooter', () => {
  before(() => {
    cy.visit(vars.host)
  })

  it('Has a current copyright', () => {
    const copyright = cy.get('#footer-copyright')
    copyright.contains(`Copyright © ${new Date().getFullYear()}`)
    copyright.contains('All rights reserved.')
  })

  it('Has open source credits', () => {
    cy.get('#footer-credits').contains('Created with open source.')
  })
})