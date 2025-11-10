import type { AIMessage, HealthStatus, ServiceStatus } from './types';

const DEFAULT_API_BASE_URL = 'https://api.lsshmx.shop';

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

const apiBaseUrl = (() => {
  const explicitBase =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ??
    (import.meta.env.VITE_GRAPHQL_ENDPOINT as string | undefined)?.trim();
  return explicitBase ? stripTrailingSlash(explicitBase) : DEFAULT_API_BASE_URL;
})();

async function request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${ensureLeadingSlash(path)}`, init);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Request to ${path} failed with status ${response.status}${errorText ? `: ${errorText}` : ''}`
    );
  }

  if (response.status === 204) {
    return {} as TResponse;
  }

  return (await response.json()) as TResponse;
}

type WorkerHealthResponse = {
  message: string;
  model?: string | null;
};

export async function fetchWorkerHealth(): Promise<{
  status: ServiceStatus;
  health: HealthStatus;
}> {
  const data = await request<WorkerHealthResponse>('/health');
  const status: ServiceStatus = {
    message: data.message,
    model: data.model ?? null
  };

  const health: HealthStatus = {
    status: data.message,
    timestamp: new Date().toISOString()
  };

  return { status, health };
}

export async function generateAIResponse(message: string): Promise<AIMessage> {
  const payload = JSON.stringify({ message });
  return request<AIMessage>('/openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: payload
  });
}
