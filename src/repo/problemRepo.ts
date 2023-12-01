import { type DocumentClient } from 'aws-sdk/clients/dynamodb'
import { DateTime } from 'luxon'

import { Problem } from '@models/problem'
import { dbClient } from '@services/db'

type ProblemPayload = {
  category: Problem.Category
  id: string
  title: string
  url: string
  topics: string[]
  difficulty: string
}

type DailyProblem = Record<
  Problem.Category,
  {
    id: string
    title: string
    difficulty: Problem.Difficulty
    url: string
    topics: string[]
  }
>

export default class ProblemRepo {
  static TABLE_NAME = process.env.PROBLEM_TABLE_NAME
  static DATE_FORMAT = 'D'

  public async getDailyProblems(today: Problem.Date): Promise<DailyProblem> {
    const anyProblem = await this._get('ANY', today)
    const easyProblem = await this._get('EASY', today)
    const mediumProblem = await this._get('MEDIUM', today)
    const hardProblem = await this._get('HARD', today)

    const allProblems = [
      anyProblem,
      easyProblem,
      mediumProblem,
      hardProblem,
    ].reduce(
      (problems: DailyProblem, currProblem) => {
        const problemKey = currProblem.PK.replace(Problem.prefixes.problem, '')
        problems[problemKey] = {
          id: currProblem.ID,
          title: currProblem.TITLE,
          difficulty: currProblem.DIFFICULTY,
          topics: currProblem.TOPICS,
          url: currProblem.URL,
        }

        return problems
      },
      {
        ANY: null,
        EASY: null,
        MEDIUM: null,
        HARD: null,
      }
    )

    return allProblems
  }

  public async getPastWeekProblemIds(today: Problem.Date) {
    const startDate = DateTime.fromFormat(today, ProblemRepo.DATE_FORMAT)
      .minus({ days: 7 })
      .toFormat(ProblemRepo.DATE_FORMAT)

    const anyProblemIds = await this._getProblemIds({
      category: 'ANY',
      date: { start: startDate, end: today },
    })
    const easyProblemIds = await this._getProblemIds({
      category: 'EASY',
      date: { start: startDate, end: today },
    })
    const mediumProblemIds = await this._getProblemIds({
      category: 'MEDIUM',
      date: { start: startDate, end: today },
    })
    const hardProblemIds = await this._getProblemIds({
      category: 'HARD',
      date: { start: startDate, end: today },
    })

    return {
      ANY: anyProblemIds,
      EASY: easyProblemIds,
      MEDIUM: mediumProblemIds,
      HARD: hardProblemIds,
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
            DIFFICULTY: ProblemRepo._formatDifficulty(problem.difficulty),
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

  private async _getProblemIds({
    category,
    date,
  }: {
    category: Problem.Category
    date: {
      start: Problem.Date
      end: Problem.Date
    }
  }): Promise<string[]> {
    const { PK } = Problem.makeKeys({
      category: category,
      date: date.end,
    })

    try {
      const response = await dbClient
        .query({
          TableName: ProblemRepo.TABLE_NAME,
          KeyConditionExpression:
            'PK = :pk and SK BETWEEN :start_date AND :end_date',
          ExpressionAttributeValues: {
            ':pk': PK,
            ':start_date': date.start,
            ':end_date': date.end,
          },
        })
        .promise()

      const problemIds = response.Items.map(
        (item: Problem.ProblemItem) => item.ID
      )

      return problemIds
    } catch (e) {
      console.log(
        `Error retrieving past week problem IDs for date: ${date.end} and category: ${category}`
      )
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

  private static _formatDifficulty(difficulty: string) {
    switch (difficulty) {
      case 'EASY':
        return Problem.Difficulty.EASY
      case 'MEDIUM':
        return Problem.Difficulty.MEDIUM
      case 'HARD':
        return Problem.Difficulty.HARD
      default:
        throw Error('Unknown difficulty')
    }
  }
}
