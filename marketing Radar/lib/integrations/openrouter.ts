/**
 * OpenRouter Integration
 * Unified LLM gateway for Claude, GPT, and other models
 */

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not found');
    }
  }

  async chat(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Arcana Radar',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Convenience methods for common models
  async claude(
    messages: OpenRouterMessage[],
    options?: { temperature?: number; max_tokens?: number }
  ): Promise<string> {
    const response = await this.chat({
      model: 'anthropic/claude-3.5-sonnet',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 4000,
    });

    return response.choices[0].message.content;
  }

  async gpt4(
    messages: OpenRouterMessage[],
    options?: { temperature?: number; max_tokens?: number }
  ): Promise<string> {
    const response = await this.chat({
      model: 'openai/gpt-4-turbo',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 4000,
    });

    return response.choices[0].message.content;
  }

  async gpt35(
    messages: OpenRouterMessage[],
    options?: { temperature?: number; max_tokens?: number }
  ): Promise<string> {
    const response = await this.chat({
      model: 'openai/gpt-3.5-turbo',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2000,
    });

    return response.choices[0].message.content;
  }
}

// Singleton instance
let openRouterClient: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (!openRouterClient) {
    openRouterClient = new OpenRouterClient();
  }
  return openRouterClient;
}
