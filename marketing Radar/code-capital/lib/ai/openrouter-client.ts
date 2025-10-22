/**
 * OpenRouter API Client
 * Provides access to multiple AI models through a single API
 * https://openrouter.ai/docs
 */

import axios from 'axios';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
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
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = defaultModel || process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet';
    
    if (!this.apiKey) {
      console.warn('⚠️  OpenRouter API key not found. Set OPENROUTER_API_KEY env variable.');
    }
  }

  /**
   * Create a chat completion
   */
  async createCompletion(
    messages: OpenRouterMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      stream?: boolean;
    }
  ): Promise<OpenRouterResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: options?.model || this.defaultModel,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096,
          top_p: options?.topP ?? 1,
          stream: options?.stream ?? false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Code & Capital',
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ OpenRouter API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Simple text completion helper
   */
  async complete(
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    const messages: OpenRouterMessage[] = [];
    
    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const response = await this.createCompletion(messages, {
      model: options?.model,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens
    });

    return response.choices[0].message.content;
  }

  /**
   * Get available models
   */
  async getModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('❌ Failed to fetch models:', error);
      throw error;
    }
  }

  /**
   * Get model pricing and info
   */
  getModelInfo(modelId: string) {
    const models: Record<string, any> = {
      'anthropic/claude-3.5-sonnet': {
        name: 'Claude 3.5 Sonnet',
        contextWindow: 200000,
        pricing: { prompt: 3, completion: 15 }, // per 1M tokens
        description: 'Best for complex analysis and writing'
      },
      'anthropic/claude-3-opus': {
        name: 'Claude 3 Opus',
        contextWindow: 200000,
        pricing: { prompt: 15, completion: 75 },
        description: 'Most capable, highest cost'
      },
      'anthropic/claude-3-haiku': {
        name: 'Claude 3 Haiku',
        contextWindow: 200000,
        pricing: { prompt: 0.25, completion: 1.25 },
        description: 'Fast and cheap for simple tasks'
      },
      'openai/gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        contextWindow: 128000,
        pricing: { prompt: 10, completion: 30 },
        description: 'OpenAI\'s most capable model'
      },
      'openai/gpt-4o': {
        name: 'GPT-4o',
        contextWindow: 128000,
        pricing: { prompt: 5, completion: 15 },
        description: 'Optimized GPT-4'
      },
      'google/gemini-pro-1.5': {
        name: 'Gemini Pro 1.5',
        contextWindow: 1000000,
        pricing: { prompt: 1.25, completion: 5 },
        description: 'Huge context window'
      },
      'meta-llama/llama-3.1-70b-instruct': {
        name: 'Llama 3.1 70B',
        contextWindow: 128000,
        pricing: { prompt: 0.35, completion: 0.4 },
        description: 'Open source, very cheap'
      }
    };

    return models[modelId] || { name: modelId, description: 'Unknown model' };
  }

  /**
   * Estimate cost for a completion
   */
  estimateCost(promptTokens: number, completionTokens: number, modelId?: string): number {
    const model = this.getModelInfo(modelId || this.defaultModel);
    if (!model.pricing) return 0;

    const promptCost = (promptTokens / 1_000_000) * model.pricing.prompt;
    const completionCost = (completionTokens / 1_000_000) * model.pricing.completion;

    return promptCost + completionCost;
  }
}

// Recommended models for different tasks
export const MODELS = {
  // Best for investment analysis (balance of quality and cost)
  ANALYSIS: 'anthropic/claude-3.5-sonnet',
  
  // Best for newsletter writing (high quality)
  WRITING: 'anthropic/claude-3.5-sonnet',
  
  // Best for quick summaries (cheap and fast)
  SUMMARY: 'anthropic/claude-3-haiku',
  
  // Best for data extraction (cheap)
  EXTRACTION: 'meta-llama/llama-3.1-70b-instruct',
  
  // Alternative: GPT-4 if you prefer OpenAI
  GPT4: 'openai/gpt-4o'
};

// Example usage
if (require.main === module) {
  const client = new OpenRouterClient();
  
  (async () => {
    try {
      console.log('Testing OpenRouter API...\n');
      
      // Test completion
      const response = await client.complete(
        'What are the top 3 AI stocks to watch in 2025? Give a brief 2-sentence answer.',
        {
          model: MODELS.ANALYSIS,
          temperature: 0.7,
          maxTokens: 200
        }
      );
      
      console.log('Response:', response);
      
      // Show model info
      const modelInfo = client.getModelInfo(MODELS.ANALYSIS);
      console.log('\nModel Info:', modelInfo);
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  })();
}
