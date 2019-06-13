/* eslint-env mocha */

const sinon = require('sinon')
const { expectAsyncError } = require('@tailored-apps/helpers/chai')

const { recordProcessor } = require('../index')

describe('record processor', () => {
  it('uses EventSource property to extract message id and body', async () => {
    const extractId = {
      first: sinon.fake.returns('first id'),
      second: sinon.fake.returns('second id')
    }

    const extractBody = {
      first: sinon.fake.returns('first message'),
      second: sinon.fake.returns('second message')
    }

    const processRecords = recordProcessor({
      handleItem: sinon.spy(),
      extractId,
      extractBody
    })

    await processRecords({
      Records: [
        { EventSource: 'first', prop: 'record 1' },
        { EventSource: 'second', prop: 'record 2' },
        { EventSource: 'first', prop: 'record 3' }
      ]
    })

    sinon.assert.calledTwice(extractId.first)
    sinon.assert.calledTwice(extractBody.first)

    sinon.assert.calledWith(extractId.first.firstCall, { prop: 'record 1' })
    sinon.assert.calledWith(extractId.first.secondCall, { prop: 'record 3' })

    sinon.assert.calledWith(extractBody.first.firstCall, { prop: 'record 1' })
    sinon.assert.calledWith(extractBody.first.secondCall, { prop: 'record 3' })

    sinon.assert.calledOnce(extractId.second)
    sinon.assert.calledOnce(extractBody.second)

    sinon.assert.calledWith(extractId.second, { prop: 'record 2' })
    sinon.assert.calledWith(extractBody.second, { prop: 'record 2' })
  })

  it('throw an error if an event source is not properly configured', async () => {
    const processRecords = recordProcessor({ handleItem: sinon.spy() })

    await expectAsyncError(
      () => processRecords({ Records: [{ EventSource: 'invalid' }] }),
      `Lambda record processor not properly configured to handle event source "invalid". Need to provide both an extractId and an extractBody function for this event source.`
    )
  })

  it('passes the message body to the provided handler function', async () => {
    const handleItem = sinon.spy()
    const processRecords = recordProcessor({ handleItem })

    await processRecords({
      Records: [
        {
          EventSource: 'aws:sqs',
          messageId: 'first message',
          body: 'first message body'
        },
        {
          EventSource: 'aws:sns',
          Sns: { MessageId: 'second message', Message: 'second message body' }
        }
      ]
    })

    sinon.assert.calledTwice(handleItem)
    sinon.assert.calledWith(handleItem.firstCall, 'first message body')
    sinon.assert.calledWith(handleItem.secondCall, 'second message body')
  })

  it('returns an object containing the individual responses', async () => {
    const processRecords = recordProcessor({
      handleItem: sinon
        .stub()
        .onFirstCall()
        .returns('first response')
        .onSecondCall()
        .returns('second response')
    })

    const response = await processRecords({
      Records: [
        { EventSource: 'aws:sqs', messageId: 'first message' },
        { EventSource: 'aws:sns', Sns: { MessageId: 'second message' } }
      ]
    })

    expect(response).to.deep.equal({
      'first message': 'first response',
      'second message': 'second response'
    })
  })
})
