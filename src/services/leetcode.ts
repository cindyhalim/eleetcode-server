import { Problem } from '@models/problem'
import fetch from 'node-fetch'

type RawQuestionResponse = {
  randomQuestion: {
    titleSlug: string
    title: string
    questionFrontendId: string
    difficulty: string
    topicTags: { name: string }[]
    isPaidOnly: boolean
  }
}

const MAX_RETRY = 20

export class LeetcodeService {
  private static SERVICE_URL = 'https://leetcode.com/graphql/'
  private static BASE_PROBLEM_URL = 'https://leetcode.com/problems'

  public async getRandomQuestion(category: Problem.Category) {
    const query = `query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
      randomQuestion(categorySlug: $categorySlug, filters: $filters) {
          titleSlug
          title
          questionFrontendId
          difficulty
          isPaidOnly
          topicTags {
              name
          }
    }
  }`

    const variables = {
      categorySlug: '',
      filters: category === 'ANY' ? {} : { difficulty: category },
    }

    const body = {
      query,
      variables,
    }

    try {
      let count = 0
      let isPaidOnly = true
      let rawQuestion: RawQuestionResponse = null
      while (isPaidOnly && count < MAX_RETRY) {
        const response = await fetch(LeetcodeService.SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }).then((res) => res.json() as any)
        count++
        rawQuestion = response.data
        isPaidOnly = rawQuestion.randomQuestion.isPaidOnly
      }

      return {
        id: rawQuestion.randomQuestion.questionFrontendId,
        title: rawQuestion.randomQuestion.title,
        url: `${LeetcodeService.BASE_PROBLEM_URL}/${rawQuestion.randomQuestion.titleSlug}`,
        difficulty: rawQuestion.randomQuestion.difficulty.toUpperCase(),
        topics: rawQuestion.randomQuestion.topicTags.map(
          (topicTag) => topicTag.name
        ),
      }
    } catch (e) {
      console.log('LeetcodeService: Error retrieving question', e)
      throw Error('Error retrieving question')
    }
  }
}
