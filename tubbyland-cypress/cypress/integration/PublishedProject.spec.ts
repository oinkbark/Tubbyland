import vars from '../fixtures/vars'

context('PublishedProject', () => {
  before(() => {
    cy.visit(`${vars.host}/art/published?stub=true`)
  })

  it('Has a title', () => {
    cy.get('#project-header').find('h1').contains('Published')
  })

  it('Has images', () => {
    const thumbnails = cy.get('#project-media-thumbnails').find('img')
    thumbnails.should('have.length', 3)
    thumbnails.should('have.attr', 'src').should('include','https://storage.googleapis.com/published.stub.tubbyland.com/')
  })

  it('Has details', () => {
    const stub = ['Cost: FREE', 'Difficulty: Easy', 'Duration: All day']
    const details = cy.get('#project-details-list').find('h3')
    details.should('have.length', 3)
    details.each((element, _index) => {
      expect(stub).to.include(element.text())
    })
  })
})