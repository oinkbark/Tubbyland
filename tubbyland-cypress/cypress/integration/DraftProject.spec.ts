import vars from '../fixtures/vars'

context('DraftProject', () => {
  before(() => {
    cy.visit(`${vars.host}/art/draft?stub=true`)
  })

  it('Has a title', () => {
    cy.get('#project-header').find('h1').contains('Draft')
  })

  it('Does not have images', () => {
    cy.get('#project-media-thumbnails').should('not.exist')
  })
  it('Has a fallback image', () => {
    cy.get('#media-fallback').find('img').should('have.attr', 'src').should('include','https://assets.tubbyland.com/png/')
  })
  it('Has an image description', () => {
    cy.get('#media-fallback').find('figcaption').contains('There are no images for this project')
  })

  it('Does not have materials', () => {
    const empty = cy.get('.empty-section')
    empty.should('have.lengthOf', 1)
    empty.find('h3').contains('There are no materials for this project')
  })

  it('Has steps', () => {
    const stepSection = cy.get('.project-text-section').find('h2').contains('Steps')
    stepSection.siblings().find('li').contains('Example Step')
  })
})