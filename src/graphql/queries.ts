export const STATUS_QUERY = /* GraphQL */ `
  query Status {
    status {
      message
      model
    }
  }
`;

export const HEALTH_QUERY = /* GraphQL */ `
  query Health {
    health {
      status
      timestamp
    }
  }
`;

export const GENERATE_MUTATION = /* GraphQL */ `
  mutation GenerateResponse($input: ChatInput!) {
    generateResponse(input: $input) {
      content
      model
      finishReason
    }
  }
`;
