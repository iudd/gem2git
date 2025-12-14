import { ProviderConfig } from '../types';

export class StorageService {
  static async loadProvidersFromDrive(): Promise<ProviderConfig[]> {
    // 模拟从云盘加载配置
    // 实际实现需要OneDrive API
    const stored = localStorage.getItem('providers');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      {
        id: '1',
        name: 'OpenAI',
        type: 'openai',
        apiKey: '',
        enabled: false
      }
    ];
  }

  static async saveProvidersToDrive(providers: ProviderConfig[]): Promise<void> {
    // 模拟保存到云盘
    localStorage.setItem('providers', JSON.stringify(providers));
    window.dispatchEvent(new Event('provider-updated'));
  }
}