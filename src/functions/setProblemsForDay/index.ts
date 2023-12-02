import { handlerPath } from '@libs/handler-resolver'

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:PutItem'],
      Resource: [{ 'Fn::GetAtt': ['ProblemTable', 'Arn'] }],
    },
  ],
  events: [
    {
      schedule: 'cron(0 0 * * ? *)', // everyday at midnight
    },
  ],
}
