import { ProviderConfig, ModelType } from '../types';

export class ApiService {
  
  /**
   * Helper to remove trailing slashes from URLs
   */
  private static normalizeUrl(url: string): string {
    return url ? url.trim().replace(/\/+$/, '') : '';
  }

  /**
   * Helper to handle API responses robustly
   */
  private static async handleResponse(res: Response, context: string): Promise<any> {
    if (!res.ok) {
      let errorMessage = `${context}失败 (Status: ${res.status})`;
      try {
        const err = await res.json();
        if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.message) {
          errorMessage = err.message;
        } else {
          errorMessage = JSON.stringify(err);
        }
      } catch (e) {
        errorMessage = `${context}失败: 服务器返回了 ${res.status} ${res.statusText}。请检查 Base URL 是否正确。`;
      }
      throw new Error(errorMessage);
    }
    return res.json();
  }

  /**
   * Wrapper for fetch with explicit timeout handling
   */
  private static async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 60000): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError' || error.message?.includes('aborted')) {
             throw new Error(`请求超时 (${timeoutMs/1000}秒) - 请检查网络或服务商响应速度`);
        }
        throw error;
    }
  }

  /**
   * Fetch available models from the provider
   */
  static async getModels(baseUrl: string, apiKey: string): Promise<string[]> {
    try {
      const cleanUrl = ApiService.normalizeUrl(baseUrl);
      // 15s timeout for model list
      const res = await ApiService.fetchWithTimeout(`${cleanUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }, 15000);

      if (!res.ok) return [];

      const data = await res.json();
      if (data && Array.isArray(data.data)) {
        return data.data.map((m: any) => m.id);
      } else if (Array.isArray(data)) {
        // Some non-standard implementations return array directly
        return data.map((m: any) => m.id || m);
      }
      return [];
    } catch (e) {
      console.warn("Failed to fetch models list", e);
      return [];
    }
  }

  /**
   * Test connection by trying to fetch models or making a cheap call
   */
  static async testConnection(provider: ProviderConfig): Promise<boolean> {
    try {
      const models = await ApiService.getModels(provider.baseUrl, provider.apiKey);
      if (models.length > 0) return true;
      
      // Fallback: Try a minimal completion generation if models endpoint is not supported
      if (provider.type === ModelType.TEXT) {
          await ApiService.generateCompletion(provider, [{ role: 'user', content: 'hi' }], { 
            temperature: 0.1, 
            model: provider.modelName 
          });
          return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  /**
   * Generate Text Completion (Chat)
   */
  static async generateCompletion(
    provider: ProviderConfig, 
    messages: { role: string; content: string }[],
    config: { temperature?: number; model?: string } = {}
  ): Promise<string> {
    const cleanUrl = ApiService.normalizeUrl(provider.baseUrl);
    const modelToUse = config.model || provider.modelName;

    const res = await ApiService.fetchWithTimeout(`${cleanUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: messages,
        temperature: config.temperature ?? 0.7,
        stream: false,
      }),
    });

    const data = await ApiService.handleResponse(res, '生成文本');
    return data.choices?.[0]?.message?.content || '无内容返回';
  }

  /**
   * Generate Image
   */
  static async generateImage(
      provider: ProviderConfig, 
      prompt: string,
      config: { size?: string; quality?: string; model?: string } = {}
  ): Promise<string> {
    const cleanUrl = ApiService.normalizeUrl(provider.baseUrl);
    const modelToUse = config.model || provider.modelName;
    
    const res = await ApiService.fetchWithTimeout(`${cleanUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        prompt: prompt,
        n: 1,
        size: config.size || "1024x1024",
        quality: config.quality || "standard",
      }),
    });

    const data = await ApiService.handleResponse(res, '生成图片');
    return data.data?.[0]?.url || '';
  }

  /**
   * Generate Video
   * Note: This assumes an OpenAI-like structure for video which isn't standard yet.
   * Adjusting for common "Sunuo" or "Sora" wrappers that often use /v1/video/generations or similar.
   * For this demo, we assume a generic endpoint `/video/generations` or falls back to chat if needed.
   */
  static async generateVideo(
      provider: ProviderConfig, 
      prompt: string,
      modelOverride?: string
  ): Promise<string> {
    const cleanUrl = ApiService.normalizeUrl(provider.baseUrl);
    const modelToUse = modelOverride || provider.modelName;

    // Try standard-ish video endpoint
    const res = await ApiService.fetchWithTimeout(`${cleanUrl}/video/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        prompt: prompt,
      }),
    });

    const data = await ApiService.handleResponse(res, '生成视频');
    // Adapt to common response formats
    return data.data?.[0]?.url || data.url || data.video_url || '';
  }
}