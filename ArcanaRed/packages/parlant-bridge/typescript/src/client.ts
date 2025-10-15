/**
 * Parlant Bridge Client - TypeScript client for Parlant Python service
 */
import axios, { AxiosInstance } from 'axios';

export interface ParlantConfig {
  baseUrl?: string;
  timeout?: number;
}

export interface ExecuteRequest {
  workflow: string;
  config: {
    targetUrl: string;
    credentials: {
      username: string;
      password: string;
    };
  };
  sessionId: string;
}

export interface AgentResponse {
  sessionId: string;
  status: 'created' | 'running' | 'completed' | 'failed';
  events: Array<any>;
  trace?: Record<string, any>;
  explanation?: Record<string, any>;
}

export interface AgentStatus {
  sessionId: string;
  workflow: string;
  status: string;
}

export class ParlantClient {
  private client: AxiosInstance;

  constructor(config: ParlantConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseUrl || 'http://localhost:8000',
      timeout: config.timeout || 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string; parlant_ready: boolean }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Execute an agent for a workflow
   */
  async executeAgent(request: ExecuteRequest): Promise<AgentResponse> {
    const response = await this.client.post<AgentResponse>('/api/agent/execute', request);
    return response.data;
  }

  /**
   * Get agent session status
   */
  async getAgentStatus(sessionId: string): Promise<AgentStatus> {
    const response = await this.client.get<AgentStatus>(`/api/agent/${sessionId}/status`);
    return response.data;
  }

  /**
   * Stop an agent session
   */
  async stopAgent(sessionId: string): Promise<{ sessionId: string; status: string }> {
    const response = await this.client.post(`/api/agent/${sessionId}/stop`);
    return response.data;
  }
}
