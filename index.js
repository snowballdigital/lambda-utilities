const recordProcessor = ({ handleItem, ...dependencies }) => {
  const {
    extractBody = {
      'aws:sns': record => record.Sns.Message,
      'aws:sqs': record => record.body
    },
    extractId = {
      'aws:sns': record => record.Sns.MessageId,
      'aws:sqs': record => record.messageId
    }
  } = dependencies

  return async ({ Records }) => {
    const response = {}

    for (const record of Records) {
      const eventSource = record.EventSource || record.eventSource // yeah, thanks AWS, nice consistent naming

      if (!extractId[eventSource] || !extractBody[eventSource]) {
        console.error(record)

        throw new Error(
          `Lambda record processor not properly configured to handle event source "${eventSource}". Need to provide both an extractId and an extractBody function for this event source.`
        )
      }

      const id = extractId[eventSource](record)
      const body = extractBody[eventSource](record)

      response[id] = await handleItem(body)
    }

    return response
  }
}

module.exports = {
  recordProcessor
}
