export default {
  ProblemTable: {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      TableName: '${self:provider.environment.PROBLEM_TABLE_NAME}',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
    },
  },
}
