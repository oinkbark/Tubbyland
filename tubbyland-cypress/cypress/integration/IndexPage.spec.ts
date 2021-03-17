import vars from '../fixtures/vars'

context('IndexPage', () => {
  before(() => {
    cy.visit(vars.host)
  })

  it('Has an intro header', () => {
    cy.get('#intro-header').find('h1').contains('Welcome To TubbyLand')
  })
  it('Has an intro subheader', () => {
    cy.get('#intro-header').find('h2').contains('You are home now')
  })
  it('Has an intro image', () => {
    // http://assets.tubbyland.com/png/tubb.png
    cy.get('#intro-image').should('have.attr', 'src').should('include','https://assets.tubbyland.com/png/')
  })


  it('Has info card headers', () => {
    cy.get('.info-header').find('h2').should('be.visible')
  })
  it('Has info cards', () => {
    cy.get('.info-card').children().should('have.length.at.least', 2)
  })

  it('Has info card images', () => {
    const images = cy.get('.info-card').children()
    images.should('have.class', 'svg')
    images.should('have.attr', 'src').should('include','https://assets.tubbyland.com/svg/')
  })
})