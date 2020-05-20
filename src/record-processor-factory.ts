import {
  BodyExtractors,
  IdExtractors,
  ProcessedRecordsResponse,
  RecordProcessorFactoryArguments,
} from './interfaces/record-processor.interface'

export const bodyExtractors = (): BodyExtractors => ({
  'aws:sns': record => record.Sns.Message,
  'aws:sqs': record => record.body,
})

export const idExtractors = (): IdExtractors => ({
  'aws:sns': record => record.Sns.MessageId,
  'aws:sqs': record => record.messageId,
})

export const recordProcessorFactory = <
  RecordType = any,
  BodyType = any,
  ItemResponseType = any
>({
  handleItem,
  ...dependencies
}: RecordProcessorFactoryArguments<RecordType, BodyType, ItemResponseType>) => {
  const {
    extractBody = bodyExtractors(),
    extractId = idExtractors(),
    getEventSource = (record: any) => record.EventSource || record.eventSource, // yeah, thanks AWS, nice consistent naming
  } = dependencies

  return async ({
    Records,
  }): Promise<ProcessedRecordsResponse<ItemResponseType>> => {
    const response = {}

    for (const record of Records) {
      const eventSource = getEventSource(record)

      if (!extractId[eventSource] || !extractBody[eventSource]) {
        console.error(record)

        throw new Error(
          `Lambda record processor not properly configured to handle event source "${eventSource}". Need to provide both an extractId and an extractBody function for this event source.`,
        )
      }

      const id = extractId[eventSource](record)
      const body = extractBody[eventSource](record)

      response[id] = await handleItem(body)
    }

    return response
  }
}
