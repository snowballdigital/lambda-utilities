const sinon = require('sinon')

const lu = require('../index')

describe('crystallize lambda utilities', () => {
  describe('parameter normalizaion', () => {
    const normalize = args =>
      lu.normalizeRequestParameters({ headers: {}, ...args })

    it('includes normalized properties', () => {
      const normalized = normalize({})

      expect(normalized).to.have.all.keys([
        'headers',
        'query',
        'path',
        'method',
        'params',
        'body'
      ])
    })

    it('converts all header names to lowercase', () => {
      const headers = {
        FIRST: 'one',
        second: 'two',
        Third: 'three'
      }

      const normalized = normalize({ headers })

      expect(Object.keys(normalized.headers)).to.have.all.members([
        'first',
        'second',
        'third'
      ])
    })

    it('normalizes queryStringParameters', () => {
      expect(
        normalize({ queryStringParameters: { prop: 'value' } }).query
      ).to.deep.equal({ prop: 'value' })
      expect(normalize({}).query).to.deep.equal({})
    })

    it('normalizes pathParameters', () => {
      expect(
        normalize({ pathParameters: { prop: 'value' } }).params
      ).to.deep.equal({ prop: 'value' })
      expect(normalize({}).params).to.deep.equal({})
    })

    it(' httpMethod', () => {
      const normalized = normalize({ httpMethod: 'mocha' })

      expect(normalized.method).to.equal('mocha')
    })

    it('parses request body for application/json content', () => {
      const normalized = normalize({
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prop: 'test' })
      })

      expect(normalized.body).to.deep.equal({ prop: 'test' })
    })
  })

  describe('request handler normalization', () => {
    it('returns a handler function', () => {
      const handler = lu.normalizeRequestHandler(sinon.spy(), sinon.spy())

      expect(handler).to.be.a('function')
    })

    it('calls the handler function with normalized request parameters', async () => {
      const normalizeParams = sinon.fake.returns({ prop: 'value' })
      const handler = sinon.spy()

      await lu.normalizeRequestHandler(handler, normalizeParams)()

      sinon.assert.calledOnce(normalizeParams)
      sinon.assert.calledOnce(handler)
      sinon.assert.calledWith(handler, { prop: 'value' })
    })

    it('uses status 204 for undefined handler return values', async () => {
      const response = await lu.normalizeRequestHandler(
        sinon.fake.returns(undefined),
        sinon.spy()
      )()

      expect(response.statusCode).to.equal(204)
      expect(response.body).to.equal(undefined)
    })

    it('stringifies handler return value into response body', async () => {
      const response = await lu.normalizeRequestHandler(
        sinon.fake.returns({ prop: 'value' }),
        sinon.spy()
      )()

      expect(response).to.deep.equal({
        statusCode: 200,
        body: JSON.stringify({ prop: 'value' })
      })
    })

    describe('error handling', () => {
      const statusCodeThrower = (code, propName = 'statusCode') => () => {
        const e = new Error(`status code prop "${propName}`)

        if (code) {
          e[propName] = code
        }

        throw e
      }

      const normalize = (fn, normalizeParams = sinon.fake.returns({})) =>
        lu.normalizeRequestHandler(fn, normalizeParams)

      it('returns a well formatted response', async () => {
        const handle = normalize(statusCodeThrower())
        const response = await handle()

        expect(response).to.have.all.keys(['statusCode', 'body'])
      })

      it("uses an error's status code", async () => {
        const r1 = await normalize(statusCodeThrower(418))()
        expect(r1.statusCode).to.equal(418)

        const r2 = await normalize(statusCodeThrower(419, 'status'))()
        expect(r2.statusCode).to.equal(419)

        const r3 = await normalize(statusCodeThrower(420, 'code'))()
        expect(r3.statusCode).to.equal(420)

        const r4 = await normalize(statusCodeThrower())()
        expect(r4.statusCode).to.equal(500)
      })

      it("uses an error's error prop for the response body", async () => {
        const throwErr = () => {
          let e = new Error()

          e.body = 'not this one'
          e.message = 'not this one either'
          e.error = 'using "error" prop'

          throw e
        }

        const response = await normalize(throwErr)()

        expect(response.body).to.deep.equal(
          JSON.stringify({ message: 'using "error" prop' })
        )
      })

      it("uses an error's body prop for the response body", async () => {
        const throwErr = () => {
          let e = new Error()

          e.body = 'using "body" prop'
          e.message = 'not this one'

          throw e
        }

        const response = await normalize(throwErr)()

        expect(response.body).to.deep.equal(
          JSON.stringify({ message: 'using "body" prop' })
        )
      })

      it("uses an error's message for the response body", async () => {
        const throwErr = () => {
          let e = new Error('using "message" prop')

          throw e
        }
        const response = await normalize(throwErr)()

        expect(response.body).to.deep.equal(
          JSON.stringify({ message: 'using "message" prop' })
        )
      })
    })
  })
})
