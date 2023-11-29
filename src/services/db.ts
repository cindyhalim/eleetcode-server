import * as AWS from 'aws-sdk'

export const dbClient = new AWS.DynamoDB.DocumentClient()
