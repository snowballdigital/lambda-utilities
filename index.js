const normalizeRequestParameters = ({
  headers,
  path,
  pathParameters,
  httpMethod,
  queryStringParameters,
  body
}) => {
  const standardizedHeaders = Object.entries(headers).reduce(
    (acc, [headerName, value]) => {
      return { ...acc, [headerName.toLowerCase()]: value }
    },
    {}
  )

  const isJson =
    standardizedHeaders['content-type'] &&
    standardizedHeaders['content-type'].toLowerCase() === 'application/json'

  return {
    headers: standardizedHeaders,
    query: queryStringParameters || {},
    path,
    method: httpMethod,
    params: pathParameters || {},
    body: body && isJson ? JSON.parse(body) : body
  }
}

const normalizeRequestHandler = (
  func,
  normalizeParams = normalizeRequestParameters
) => async (event, context) => {
  let statusCode
  let body

  try {
    body = await func(normalizeParams(event), event, context)

    statusCode = typeof body !== 'undefined' ? 200 : 204
  } catch (e) {
    statusCode = e.statusCode || e.status || e.code || 500
    body = {
      message: e.error || e.body || e.message || 'Internal server error'
    }
  }

  return {
    statusCode,
    body: typeof body !== 'undefined' ? JSON.stringify(body) : undefined
  }
}

module.exports = {
  normalizeRequestParameters,
  normalizeRequestHandler
}
