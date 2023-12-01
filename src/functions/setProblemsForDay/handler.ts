import { DateTime } from 'luxon'

import { middyfy } from '@libs/lambda'
import { Problem } from '@models/problem'
import ProblemRepo from '@repo/problemRepo'
import { LeetcodeService } from '@services/leetcode'

const RETRY_LIMIT = 10

const setProblemsForDay = async () => {
  const leetcode = new LeetcodeService()
  const problemRepo = new ProblemRepo()

  const today = DateTime.now().toFormat(ProblemRepo.DATE_FORMAT)

  console.log(`fetching problems for today: ${today}`)

  const blackListProblemIds = await problemRepo.getPastWeekProblemIds(today)

  const questionPromises = ['ANY', 'EASY', 'MEDIUM', 'HARD'].map(
    async (category: Problem.Category) => {
      let counter = 0
      while (counter <= RETRY_LIMIT) {
        const blackListProblemIdsForCategory = blackListProblemIds[category]

        const question = await leetcode.getRandomQuestion(category)
        counter += 1

        if (!blackListProblemIdsForCategory.includes(question.id)) {
          return { ...question, category }
        }
      }
    }
  )

  const problems = await Promise.all(questionPromises)

  await problemRepo.save({ date: today, problems })
  console.log('Successfully saved questions for the day')
}

export const main = middyfy(setProblemsForDay)
