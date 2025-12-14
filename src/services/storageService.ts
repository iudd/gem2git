import { ProviderConfig } from '../types';

export class StorageService {
  private static readonly BIN_ID = '693e1ee1ae596e708f986d9f';
  private static readonly API_KEY = '$2a$10$IK.Yjp2YJipFKeVQ0LlzWeyqWxYO7W44Rq0xqP5B/jD4iT1w6CtAq';
  private static readonly BASE_URL = 'https://api.jsonbin.io/v3/b';

  static async loadProvidersFromDrive(): Promise<ProviderConfig[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/${this.BIN_ID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const providers = data.record || [];
        console.log('Loaded providers from JSONBin:', providers);
        return providers;
      } else {
        console.warn('Failed to load from JSONBin, falling back to localStorage');
        throw new Error('JSONBin load failed');
      }
    } catch (error) {
      console.warn('Error loading from JSONBin:', error);
      // Fallback to localStorage
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
  }

  static async saveProvidersToDrive(providers: ProviderConfig[]): Promise<void> {
    try {
      const response = await fetch(`${this.BASE_URL}/${this.BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(providers),
      });

      if (response.ok) {
        console.log('Saved providers to JSONBin:', providers);
        window.dispatchEvent(new Event('provider-updated'));
      } else {
        console.warn('Failed to save to JSONBin, falling back to localStorage');
        throw new Error('JSONBin save failed');
      }
    } catch (error) {
      console.warn('Error saving to JSONBin:', error);
      // Fallback to localStorage
      localStorage.setItem('providers', JSON.stringify(providers));
      window.dispatchEvent(new Event('provider-updated'));
    }
  }
}