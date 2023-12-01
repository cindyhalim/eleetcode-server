import { Problem } from '@models/problem'
import fetch from 'node-fetch'

type RawQuestionResponse = {
  randomQuestion: {
    titleSlug: string
    title: string
    questionFrontendId: string
    difficulty: string
    topicTags: { name: string }[]
  }
}

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
      const response = await fetch(LeetcodeService.SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }).then((res) => res.json() as any)

      const rawQuestion: RawQuestionResponse = response.data

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
