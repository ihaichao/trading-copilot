import { Injectable, Logger } from '@nestjs/common';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly baseUrl = 'https://openrouter.ai/api/v1';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY ?? '';
    if (!this.apiKey) {
      this.logger.warn(
        'OPENROUTER_API_KEY not configured — AI advice will fall back to rule engine',
      );
    }
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async chat(messages: ChatMessage[], model?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model ?? process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat-v3-0324',
        messages,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OpenRouterResponse;

    if (data.error) {
      throw new Error(`OpenRouter API error: ${data.error.message}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenRouter returned empty response');
    }

    return content;
  }
}
