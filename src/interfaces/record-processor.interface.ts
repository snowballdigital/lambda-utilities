export interface IdExtractors<RecordType = any> {
  [key: string]: (record: RecordType) => string
}

export interface BodyExtractors<RecordType = any, BodyType = any> {
  [key: string]: (record: RecordType) => BodyType
}

export interface RecordProcessorFactoryArguments<
  RecordType,
  BodyType,
  ItemResponseType
> {
  handleItem: (body: BodyType) => ItemResponseType
  extractId?: IdExtractors
  extractBody?: BodyExtractors
  getEventSource?: (record: RecordType) => string
}

export interface ProcessedRecordsResponse<ResponseType> {
  [id: string]: ResponseType
}
