import { ProviderConfig, ModelType } from '../types';

export class ApiService {
  
  /**
   * Fetch available models from the provider
   * Assumes OpenAI-compatible endpoint: GET /models
   */
  static async getModels(baseUrl: string, apiKey: string): Promise<string[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      // Ensure no double slashes if user added trailing slash
      const cleanUrl = baseUrl.replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      // Standard OpenAI format: { data: [{ id: "model-id", ... }] }
      if (data && Array.isArray(data.data)) {
        return data.data.map((m: any) => m.id);
      }
      return [];
    } catch (e) {
      console.warn("Failed to fetch models list", e);
      return [];
    } finally {
        clearTimeout(timeoutId);
    }
  }

  /**
   * Test a provider configuration by making a minimal request
   */
  static async testConnection(config: ProviderConfig): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      if (config.type === ModelType.TEXT) {
        // Test Chat Completion
        const res = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.modelName,
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 5,
          }),
          signal: controller.signal,
        });
        return res.ok;
      } else if (config.type === ModelType.IMAGE) {
        // Test Image Generation
        // Try /models first as it is cheaper/safer
        const res = await fetch(`${config.baseUrl}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
            },
            signal: controller.signal,
        });
        return res.ok;
      } else {
        // Video
        const res = await fetch(`${config.baseUrl}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
            },
            signal: controller.signal,
        });
        return res.ok;
      }
    } catch (e) {
      console.error("Connection test failed", e);
      return false;
    } finally {
        clearTimeout(timeoutId);
    }
  }

  static async generateCompletion(
    config: ProviderConfig, 
    messages: any[], 
    options?: { temperature?: number }
  ): Promise<string> {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: messages,
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || '文本生成失败');
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  static async generateImage(
    config: ProviderConfig, 
    prompt: string, 
    options?: { size?: string, quality?: string }
  ): Promise<string> {
    const res = await fetch(`${config.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        prompt: prompt,
        n: 1,
        size: options?.size || "1024x1024",
        quality: options?.quality || "standard",
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || '图像生成失败');
    }

    const data = await res.json();
    return data.data[0].url;
  }

  // Experimental Video Generation (Mocking OpenAI format behavior)
  static async generateVideo(config: ProviderConfig, prompt: string): Promise<string> {
    // There is no standard OpenAI video endpoint yet.
    // We assume the provider uses a structure similar to images or a specific /video/generations path
    const endpoint = config.baseUrl.includes('video') ? config.baseUrl : `${config.baseUrl}/video/generations`;
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        prompt: prompt,
      }),
    });

    if (!res.ok) {
        if(res.status === 404) {
           throw new Error("未找到视频接口端点。请确保视频服务的 BaseURL 正确。");
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || '视频生成失败');
    }

    const data = await res.json();
    // Support various common return formats for video proxies
    return data.data?.[0]?.url || data.url || data.output || '';
  }
}