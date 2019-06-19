/* eslint-env mocha */

const lib = require('../index')

describe('new library', () => {
  it('is very useful', () => {
    expect(lib.isUseful()).to.equal(true)
  })
})
