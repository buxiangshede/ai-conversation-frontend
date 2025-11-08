export type ServiceStatus = {
  message: string;
  model?: string | null;
};

export type AIMessage = {
  content: string;
  model: string;
  finishReason?: string | null;
};

