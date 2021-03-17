import vars from '../fixtures/vars'

context('FakeProject', () => {
  before(() => {
    cy.visit(`${vars.host}/art/fake?stub=true`)
  })

  it('Does not exist', () => {
    cy.get('h1').contains('That project does not exist')
  })
})