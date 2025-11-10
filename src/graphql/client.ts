type GraphQLError = {
  message: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'https://api.lsshmx.shop';

export async function requestGraphQL<TData>(
  query: string,
  path: string,
  variables?: Record<string, unknown>
): Promise<TData> {

  console.log('GraphQL Endpoint:', path, endpoint);
  const response = await fetch(`${endpoint}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`);
  }

  const result: GraphQLResponse<TData> = (await response.json()) as GraphQLResponse<TData>;

  if (result.errors?.length) {
    const [firstError] = result.errors;
    throw new Error(firstError.message);
  }

  if (!result.data) {
    throw new Error('GraphQL response does not contain data');
  }

  return result.data;
}
