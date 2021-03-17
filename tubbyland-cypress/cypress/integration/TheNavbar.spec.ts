import vars from '../fixtures/vars'

context('TheNavbar', () => {
  before(() => {
    cy.visit(vars.host)
   })

  it('Has a logo', () => {
    cy.get('#nav-image').should('have.attr', 'src').should('include','https://assets.tubbyland.com/svg/')
  })
  it('Has links', () => {
    const links = cy.get('#nav-links').find('a')
    links.should('have.length.at.least', 2)
    links.should('have.attr', 'href')
  })
})