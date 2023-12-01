import { APIGatewayProxyEvent } from 'aws-lambda'
import { DateTime } from 'luxon'

import { formatJSONResponse } from '@libs/api-gateway'
import { middyfy } from '@libs/lambda'
import ProblemRepo from '@repo/problemRepo'

function convertToDbDate(date: string) {
  const validatedDate = DateTime.fromFormat(date, 'MM-dd-yyyy')
  if (!validatedDate.isValid) {
    return ''
  }
  return validatedDate.toFormat(ProblemRepo.DATE_FORMAT)
}
const getDailyQuestions = async (event: APIGatewayProxyEvent) => {
  const problemRepo = new ProblemRepo()
  const { date } = event.pathParameters // MM-DD-YYYY

  const formattedDate = convertToDbDate(date)

  if (!formattedDate) {
    return formatJSONResponse(
      {
        message: 'Incorrect date format',
      },
      400
    )
  }

  const problems = await problemRepo.getDailyProblems(formattedDate)

  return formatJSONResponse(
    {
      problems,
    },
    200
  )
}

export const main = middyfy(getDailyQuestions)
