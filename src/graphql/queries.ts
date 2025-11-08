export const STATUS_QUERY = /* GraphQL */ `
  query Status {
    status {
      message
      model
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

