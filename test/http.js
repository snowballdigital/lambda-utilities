const lu = require('../index')

describe('crystallize lambda utilities', () => {
  describe('parameter normalizaion', () => {
    const normalize = (args) => lu.normalizeRequestParameters({ headers: { }, ...args })

    it('includes normalized properties', () => {
      const normalized = normalize({})

      expect(normalized).to.have.all.keys([ 'headers', 'query', 'path', 'method', 'params', 'body' ])
    })

    it('converts all header names to lowercase', () => {
      const headers = {
        'FIRST': 'one',
        'second': 'two',
        'Third': 'three'
      }

      const normalized = normalize({ headers })

      expect(Object.keys(normalized.headers)).to.have.all.members([ 'first', 'second', 'third' ])
    })

    it('normalizes queryStringParameters', () => {
      expect(normalize({ queryStringParameters: { prop: 'value' } }).query).to.deep.equal({ prop: 'value' })
      expect(normalize({ }).query).to.deep.equal({ })
    })

    it('normalizes pathParameters', () => {
      expect(normalize({ pathParameters: { prop: 'value' } }).params).to.deep.equal({ prop: 'value' })
      expect(normalize({}).params).to.deep.equal({ })
    })

    it(' httpMethod', () => {
      const normalized = normalize({ httpMethod: 'mocha' })

      expect(normalized.method).to.equal('mocha')
    })

    it('parses request body for application/json content', () => {
      const normalized = normalize({ headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prop: 'test' }) })

      expect(normalized.body).to.deep.equal({ prop: 'test' })
    })
  })
})
