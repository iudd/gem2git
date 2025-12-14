import { ProviderConfig, GeneratedAsset, ChatMessage } from "../types";

// This service mocks the cloud storage interactions.
// In a real app, this would use `gapi.client.drive` for Google Drive
// and the Alibaba Cloud SDK for ADrive.

const STORAGE_KEY_PROVIDERS = 'omni_providers';
const STORAGE_KEY_ASSETS = 'omni_assets';
const STORAGE_KEY_CHAT_PREFIX = 'omni_chat_';
const STORAGE_KEY_CLOUD_CONFIG = 'omni_cloud_config';

export interface CloudConfig {
  binId: string;
  apiKey: string; // X-Master-Key
}

export class StorageService {
  
  // --- Cloud Sync (JSONBin.io Implementation) ---

  static getCloudConfig(): CloudConfig | null {
    const stored = localStorage.getItem(STORAGE_KEY_CLOUD_CONFIG);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Helper to extract the actual Bin ID if user pastes a full URL
   */
  private static cleanBinId(input: string): string {
      if (!input) return '';
      const trimmed = input.trim();
      // If it looks like a URL, split and take the last part
      if (trimmed.includes('/')) {
          const parts = trimmed.split('/');
          // filter empty strings in case of trailing slash
          const validParts = parts.filter(p => p.length > 0);
          return validParts[validParts.length - 1];
      }
      return trimmed;
  }

  static saveCloudConfig(config: CloudConfig): void {
    const cleanConfig = {
        binId: this.cleanBinId(config.binId),
        apiKey: config.apiKey.trim()
    };
    localStorage.setItem(STORAGE_KEY_CLOUD_CONFIG, JSON.stringify(cleanConfig));
  }

  /**
   * Pull data from Cloud (JSONBin)
   * Returns true if successful
   */
  static async syncFromCloud(configOverride?: CloudConfig): Promise<boolean> {
    const rawConfig = configOverride || this.getCloudConfig();
    if (!rawConfig || !rawConfig.binId || !rawConfig.apiKey) {
      throw new Error("请先配置云端同步信息 (Bin ID 和 API Key)");
    }

    const config = {
        binId: this.cleanBinId(rawConfig.binId),
        apiKey: rawConfig.apiKey.trim()
    };

    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}`, {
        method: 'GET',
        headers: {
          'X-Master-Key': config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
          let errMsg = `云端同步失败 (${res.status})`;
          try {
             const errData = await res.json();
             if (errData.message) errMsg += `: ${errData.message}`;
          } catch(e) {}
          
          if (res.status === 401 || res.status === 403) throw new Error("API Key 无效或无权访问该 Bin");
          if (res.status === 404) throw new Error("Bin ID 不存在，请检查配置");
          throw new Error(errMsg);
      }

      const data = await res.json();
      const payload = data.record;

      if (!payload) {
          throw new Error("云端返回数据为空");
      }

      // Validation: Check if it looks like our schema
      if (!Array.isArray(payload.providers) && !Array.isArray(payload.assets)) {
          console.warn("Invalid payload structure:", payload);
          throw new Error("云端数据格式不正确。请确保 JSON 包含 'providers' 或 'assets' 数组。您可以尝试先从本地上传一份数据覆盖云端。");
      }

      // Restore Providers
      if (Array.isArray(payload.providers)) {
        localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(payload.providers));
      }
      // Restore Assets
      if (Array.isArray(payload.assets)) {
        localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(payload.assets));
      }
      
      console.log("[Cloud] Data synced successfully");
      return true;
    } catch (e) {
      console.error("Cloud Sync Error:", e);
      throw e;
    }
  }

  /**
   * Push data to Cloud (JSONBin)
   */
  static async syncToCloud(configOverride?: CloudConfig): Promise<{ updatedAt: string }> {
    const rawConfig = configOverride || this.getCloudConfig();
    if (!rawConfig || !rawConfig.binId || !rawConfig.apiKey) {
      throw new Error("请先配置云端同步信息 (Bin ID 和 API Key)");
    }

    const config = {
        binId: this.cleanBinId(rawConfig.binId),
        apiKey: rawConfig.apiKey.trim()
    };

    // Gather Local Data
    const providers = await this.loadProvidersFromDrive();
    const assets = this.getSavedAssets();

    // Allow upload even if empty, but maybe warn? 
    // Actually, uploading empty lists is a valid way to "clear" the cloud if desired, 
    // but usually user error. Let's ensure at least basic structure.
    
    // Construct Payload
    const payload = {
      updatedAt: Date.now(),
      providers,
      assets,
      // Note: We are not syncing chat history to keep payload small.
    };

    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}`, {
        method: 'PUT',
        headers: {
          'X-Master-Key': config.apiKey,
          'Content-Type': 'application/json',
          'X-Bin-Versioning': 'false' // Disable versioning to save space if supported plan
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
          let errMsg = `云端上传失败 (${res.status})`;
          try {
             const errData = await res.json();
             if (errData.message) errMsg += `: ${errData.message}`;
          } catch(e) {}
          
          if (res.status === 401 || res.status === 403) throw new Error("API Key 无效，请检查 Master Key");
          if (res.status === 404) throw new Error("Bin ID 不存在，请检查 Bin ID");

          throw new Error(errMsg);
      }
      
      const responseData = await res.json();
      console.log("[Cloud] Data uploaded successfully", responseData);
      
      return { 
          updatedAt: responseData.metadata?.parentId || new Date().toISOString() 
      };

    } catch (e) {
      console.error("Cloud Upload Error:", e);
      throw e;
    }
  }

  // --- Provider Management (LocalStorage) ---

  static async loadProvidersFromDrive(): Promise<ProviderConfig[]> {
    // Mock latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const stored = localStorage.getItem(STORAGE_KEY_PROVIDERS);
    return stored ? JSON.parse(stored) : [];
  }

  static async saveProviderToDrive(provider: ProviderConfig): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const current = await this.loadProvidersFromDrive();
    const index = current.findIndex(p => p.id === provider.id);
    
    let updated;
    if (index >= 0) {
        // Update existing
        updated = [...current];
        updated[index] = provider;
    } else {
        // Create new
        updated = [...current, provider];
    }
    
    localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(updated));
  }

  static async saveAllProviders(providers: ProviderConfig[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));
    localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(providers));
  }

  static async deleteProviderFromDrive(id: string): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 300));
      const current = await this.loadProvidersFromDrive();
      const updated = current.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(updated));
      
      // Also clear associated chat history
      localStorage.removeItem(`${STORAGE_KEY_CHAT_PREFIX}${id}`);
  }

  // --- Chat History Management ---

  static loadChatHistory(providerId: string): ChatMessage[] {
      const key = `${STORAGE_KEY_CHAT_PREFIX}${providerId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
  }

  static saveChatHistory(providerId: string, messages: ChatMessage[]): void {
      const key = `${STORAGE_KEY_CHAT_PREFIX}${providerId}`;
      localStorage.setItem(key, JSON.stringify(messages));
  }

  static clearChatHistory(providerId: string): void {
      const key = `${STORAGE_KEY_CHAT_PREFIX}${providerId}`;
      localStorage.removeItem(key);
  }

  // --- Asset Management (Simulated ADrive) ---

  static async uploadAssetToADrive(asset: GeneratedAsset): Promise<void> {
      // Mock upload latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const current = this.getSavedAssets();
      const updated = [asset, ...current];
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(updated));
  }

  static getSavedAssets(): GeneratedAsset[] {
      const stored = localStorage.getItem(STORAGE_KEY_ASSETS);
      return stored ? JSON.parse(stored) : [];
  }

  // --- Mock Google Sheets Reading ---

  static async readPromptsFromSheet(sheetId: string): Promise<string[]> {
      // Mock network latency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return dummy prompts for demo purposes
      return [
          "A futuristic city with flying cars, cyberpunk style",
          "A serene lake at sunset with mountains in the background",
          "Portrait of a robot mechanic fixing a vintage car",
          "Concept art of a space station orbiting Mars"
      ];
  }
}