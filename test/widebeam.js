const chaiHelpers = require('@tailored-apps/helpers/chai')
const sinon = require('sinon')

const widebeam = require('../widebeam')

const { expectAsyncError } = chaiHelpers

describe('initialization', () => {
  it('returns a function', () => {
    const broadcast = widebeam.broadcaster({ arns: { } }, () => sinon.spy())

    expect(broadcast).to.be.a('function')
  })

  it('requires list of ARNs', () => {
    expect(() => widebeam.broadcaster({}, () => sinon.spy())).to.throw('No or invalid list of ARNs provided to widebeam.broadcaster().')
    expect(() => widebeam.broadcaster({ arns: { } }, () => sinon.spy())).to.not.throw('No or invalid list of ARNs provided to widebeam.broadcaster().')
  })

  it('passes options to sns factory function', () => {
    const factory = sinon.fake.returns({})

    widebeam.broadcaster({ arns: { }, opt: 'one', param: 'two' }, factory)

    sinon.assert.calledWith(factory, { opt: 'one', param: 'two' })
  })
})

describe('broadcaster', () => {
  it('requires a valid concern', async () => {
    const broadcast = widebeam.broadcaster({ arns: { first: 'arn1' } }, () => sinon.spy())

    await expectAsyncError(() => broadcast('invalid', 'something'), 'Invalid concern specified: "invalid". Available concerns: first.')
  })

  it('calls the publish method', async () => {
    const publish = sinon.fake.returns({ promise: sinon.fake.resolves({ MessageId: 'message_id' }) })
    const broadcast = widebeam.broadcaster({ arns: { mocha: 'test' } }, () => ({ publish }))

    const id = await broadcast('mocha', 'ev', { prop: 'value' })

    sinon.assert.calledWith(publish, { Message: JSON.stringify({ concern: 'mocha', event: 'ev', meta: { prop: 'value' } }), TopicArn: 'test' })

    expect(id).to.equal('message_id')
  })
})
