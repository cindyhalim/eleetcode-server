import { type DocumentClient } from 'aws-sdk/clients/dynamodb'
import { DateTime } from 'luxon'
import { Problem } from 'src/models/problem'
import { dbClient } from 'src/services/db'

type ProblemPayload = {
  category: Problem.Category
  id: string
  title: string
  url: string
  topics: string[]
  difficulty: Problem.Difficulty
}

export default class ProblemRepo {
  static TABLE_NAME = process.env.PROBLEM_TABLE_NAME
  private static DATE_FORMAT = 'D'

  public async getForToday() {
    const today = DateTime.now().toFormat(ProblemRepo.DATE_FORMAT)

    const anyProblem = await this._get('ANY', today)
    const easyProblem = await this._get('EASY', today)
    const mediumProblem = await this._get('MEDIUM', today)
    const hardProblem = await this._get('HARD', today)

    const allProblems = [
      anyProblem,
      easyProblem,
      mediumProblem,
      hardProblem,
    ].reduce((problems, currProblem) => {
      const problemKey = currProblem.PK.replace(Problem.prefixes.problem, '')
      problems[problemKey] = {
        id: currProblem.ID,
        title: currProblem.TITLE,
        difficulty: currProblem.DIFFICULTY,
        topics: currProblem.TOPICS,
        url: currProblem.URL,
      }

      return problems
    }, {})

    return allProblems
  }

  public async getPastWeekProblemIds(
    category: Problem.Category,
    date: Problem.Date
  ): Promise<string[]> {
    const { PK } = Problem.makeKeys({
      category: category,
      date,
    })

    const startDate = DateTime.fromFormat(date, ProblemRepo.DATE_FORMAT)
      .minus({ days: 7 })
      .toFormat(ProblemRepo.DATE_FORMAT)

    try {
      const response = await dbClient
        .query({
          TableName: ProblemRepo.TABLE_NAME,
          KeyConditionExpression:
            'PK = :pk and SK BETWEEN :start_date AND :end_date',
          ExpressionAttributeValues: {
            ':pk': PK,
            ':start_date': startDate,
            ':end_date': date,
          },
        })
        .promise()

      const problemIds = response.Items.map(
        (item: Problem.ProblemItem) => item.ID
      )

      return problemIds
    } catch (e) {
      console.log(`Error retrieving past week problem IDs for date: ${date}`)
      throw e
    }
  }

  public async save({
    date,
    problems,
  }: {
    date: Problem.Date
    problems: ProblemPayload[]
  }) {
    try {
      const problemTransactWriteItems: DocumentClient.TransactWriteItemList =
        problems.map((problem) => {
          const { PK, SK } = Problem.makeKeys({
            category: problem.category,
            date,
          })
          const problemItem: Problem.ProblemItem = {
            PK,
            SK,
            ID: problem.id,
            TITLE: problem.title,
            URL: problem.url,
            DIFFICULTY: problem.difficulty,
            TOPICS: problem.topics,
          }

          return {
            Put: {
              TableName: ProblemRepo.TABLE_NAME,
              Item: problemItem,
            },
          }
        })

      await dbClient
        .transactWrite({
          TransactItems: [...problemTransactWriteItems],
        })
        .promise()
    } catch (e) {
      console.log(`Error saving problems for date: ${date}`)
      throw e
    }
  }

  private async _get(category: Problem.Category, date: Problem.Date) {
    const { PK, SK } = Problem.makeKeys({ category, date })

    try {
      const response = await dbClient
        .get({
          TableName: ProblemRepo.TABLE_NAME,
          Key: {
            PK,
            SK,
          },
        })
        .promise()

      if (!Problem.isProblemItem(response.Item)) {
        return null
      }

      return response.Item
    } catch (e) {
      console.log(`Error getting ${category} problem for date: ${date}`)
      throw e
    }
  }
}
