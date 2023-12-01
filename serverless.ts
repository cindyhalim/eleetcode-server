import getDailyProblems from '@functions/getDailyProblems'
import setProblemsForDay from '@functions/setProblemsForDay'
import type { AWS } from '@serverless/typescript'

import dynamoDb from 'src/resources/dynamoDb'

const serverlessConfiguration: AWS = {
  service: 'eleetcode',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-iam-roles-per-function'],
  provider: {
    name: 'aws',
    stage: 'api',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      PROBLEM_TABLE_NAME: '${self:service}-problem',
    },
  },
  functions: { setProblemsForDay, getDailyProblems },
  resources: {
    Resources: {
      ...dynamoDb,
    },
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
}

module.exports = serverlessConfiguration
