/**
 * Claude API Service - 与 Claude Relay Service 集成
 * 这是整个聊天应用的核心！处理所有与后端的通信
 */

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  id?: string;
  timestamp?: number;
}

export interface ChatRequest {
  messages: Message[];
  model?: string;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

// 可用的Claude模型列表
export const AVAILABLE_MODELS = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: '最新的Sonnet模型，平衡性能与效率'
  },
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4',
    description: '最强大的模型，适合复杂任务'
  }
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

class ClaudeAPIService {
  private baseURL: string;
  private apiKey: string;
  private currentModel: ModelId = 'claude-sonnet-4-20250514';

  constructor() {
    // 从环境变量或配置文件读取，空字符串表示使用相对路径（通过Vite代理）
    this.baseURL = import.meta.env.VITE_RELAY_SERVICE_URL || '';
    this.apiKey = import.meta.env.VITE_API_KEY || '';
    
    // 从localStorage加载保存的模型
    const savedModel = (localStorage.getItem('claude_model') as ModelId);
    if (savedModel) {
      this.currentModel = savedModel;
    }
  }

  /**
   * 发送消息到Claude (非流式)
   */
  async sendMessage(messages: Message[]): Promise<ChatResponse> {
    const response = await fetch(`${this.baseURL}/api/v1/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        model: this.currentModel || 'claude-sonnet-4-20250514',
        stream: false,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 发送消息到Claude (流式) - 这是精华所在！
   */
  async *sendMessageStream(messages: Message[]): AsyncGenerator<string, void, unknown> {
    const url = `${this.baseURL}/api/v1/messages`;
    const requestBody = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model: this.currentModel || 'claude-sonnet-4-20250514',
      stream: true,
      max_tokens: 4096,
    };
    
    console.log('[Claude API] Sending request to:', url);
    console.log('[Claude API] Using model:', this.currentModel);
    console.log('[Claude API] Request body:', requestBody);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestBody),
    });

    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Claude API] Error response:', errorText);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let buffer = '';
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('[Claude API] Stream ended, total chunks:', chunkCount);
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log('[Claude API] Raw chunk received:', chunk.substring(0, 200));
      buffer += chunk;
      const lines = buffer.split('\n');
      
      // 保留最后一行（可能不完整）
      buffer = lines.pop() || '';

      for (const line of lines) {
        console.log('[Claude API] Processing line:', line.substring(0, 100));
        
        // 处理错误事件
        if (line === 'event: error') {
          continue; // 下一行将包含错误数据
        }
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            
            // 检查是否是错误响应
            if (parsed.error) {
              console.error('[Claude API] Error from server:', parsed);
              throw new Error(parsed.error + ': ' + (parsed.details || 'Unknown error'));
            }
            
            // 处理不同类型的SSE事件 - 修复Claude API响应格式
            if (parsed.type === 'content_block_delta') {
              // Claude API实际返回格式: delta.text_delta.text
              const text = parsed.delta?.text_delta?.text || parsed.delta?.text || '';
              if (text) {
                chunkCount++;
                console.log(`[Claude API] Yielding chunk ${chunkCount}:`, text);
                yield text;
              }
            } else if (parsed.type === 'message_delta') {
              // message_delta 通常不包含文本内容，只有停止信息
            } else if (parsed.type === 'ping') {
              // 忽略ping事件
            } else if (parsed.content) {
              yield parsed.content;
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  }

  /**
   * 设置API Key
   */
  setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * 设置基础URL
   */
  setBaseURL(url: string) {
    this.baseURL = url;
  }

  /**
   * 设置当前模型
   */
  setModel(modelId: ModelId) {
    this.currentModel = modelId;
  }

  /**
   * 获取当前模型
   */
  getCurrentModel(): ModelId {
    return this.currentModel;
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels() {
    return AVAILABLE_MODELS;
  }

  /**
   * 获取可用模型列表
   */
  async getModels() {
    const response = await fetch(`${this.baseURL}/api/v1/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    return await response.json();
  }
}

export default new ClaudeAPIService();