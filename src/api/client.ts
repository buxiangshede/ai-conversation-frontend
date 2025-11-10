import type { AIMessage, HealthStatus, ServiceStatus } from './types';

const DEFAULT_GRAPHQL_ENDPOINT = 'https://api.lsshmx.shop/api';

const graphqlEndpoint: string =
  (import.meta.env.VITE_GRAPHQL_ENDPOINT as string | undefined)?.trim() ?? DEFAULT_GRAPHQL_ENDPOINT;

type GraphQLRequestOptions<TVariables extends Record<string, unknown> | undefined = undefined> = {
  query: string;
  variables?: TVariables;
  operationName?: string;
};

type GraphQLErrorPayload = {
  message: string;
};

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: GraphQLErrorPayload[];
};

async function executeGraphQL<
  TData,
  TVariables extends Record<string, unknown> | undefined = undefined
>(options: GraphQLRequestOptions<TVariables>): Promise<TData> {
  console.log('GraphQL Request Options------:', graphqlEndpoint);
  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GraphQL request failed with status ${response.status}${errorText ? `: ${errorText}` : ''}`
    );
  }

  const result = (await response.json()) as GraphQLResponse<TData>;
  if (result.errors?.length) {
    const details = result.errors.map((error) => error.message).join('; ');
    throw new Error(`GraphQL errors: ${details}`);
  }

  if (!result.data) {
    throw new Error('GraphQL response did not include `data`.');
  }

  return result.data;
}

type StatusQueryResult = {
  status: ServiceStatus;
};

const STATUS_QUERY = /* GraphQL */ `
  query Status {
    status {
      message
      model
    }
  }
`;

export async function fetchWorkerHealth(): Promise<{
  status: ServiceStatus;
  health: HealthStatus;
}> {
  const data = await executeGraphQL<StatusQueryResult>({
    query: STATUS_QUERY,
    operationName: 'Status'
  });

  const status = data.status;
  const health: HealthStatus = {
    status: status.message,
    timestamp: new Date().toISOString()
  };

  return { status, health };
}

type GenerateResponseVariables = {
  input: {
    message: string;
  };
};

type GenerateResponseResult = {
  generateResponse: AIMessage;
};

const GENERATE_RESPONSE_MUTATION = /* GraphQL */ `
  mutation GenerateResponse($input: ChatInput!) {
    generateResponse(input: $input) {
      content
      model
      finishReason
    }
  }
`;

export async function generateAIResponse(message: string): Promise<AIMessage> {
  const data = await executeGraphQL<GenerateResponseResult, GenerateResponseVariables>({
    query: GENERATE_RESPONSE_MUTATION,
    operationName: 'GenerateResponse',
    variables: {
      input: { message }
    }
  });

  return data.generateResponse;
}
