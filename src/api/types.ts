export type ServiceStatus = {
  message: string;
  model?: string | null;
};

export type HealthStatus = {
  status: string;
  timestamp: string;
};

export type AIMessage = {
  content: string;
  model: string;
  finishReason?: string | null;
};
