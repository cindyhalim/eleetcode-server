import { handlerPath } from '@libs/handler-resolver'

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:GetItem'],
      Resource: [{ 'Fn::GetAtt': ['ProblemTable', 'Arn'] }],
    },
  ],
  events: [
    {
      http: {
        method: 'get',
        path: 'problems/date/{date}',
        cors: true,
        request: {
          parameters: {
            paths: {
              date: true,
            },
          },
        },
      },
    },
  ],
}
