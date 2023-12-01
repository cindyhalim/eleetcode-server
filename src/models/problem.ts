import { type DocumentClient } from 'aws-sdk/clients/dynamodb'

export namespace Problem {
  export const prefixes = {
    problem: 'PROBLEM_',
  } as const

  export type Date = string // MM/DD/YYYY
  export type Category = 'ANY' | 'EASY' | 'MEDIUM' | 'HARD'
  export enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
  }
  export type ProblemPk = `${typeof prefixes.problem}${Category}`
  export type ProblemItem = {
    PK: ProblemPk
    SK: Date // created at
    ID: string
    TITLE: string
    URL: string
    DIFFICULTY: Difficulty
    TOPICS: string[]
  }

  export function makeKeys({
    category,
    date,
  }: {
    category: Category
    date: Date
  }): { PK: ProblemPk; SK: Date } {
    return {
      PK: `${prefixes.problem}${category}`,
      SK: date,
    }
  }

  export function isProblemItem(
    dbItem: DocumentClient.AttributeMap
  ): dbItem is ProblemItem {
    if (!dbItem) return false
    return dbItem.PK.includes(prefixes.problem)
  }
}
