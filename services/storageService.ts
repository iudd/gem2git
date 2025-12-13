import { ProviderConfig, GeneratedAsset } from "../types";

// This service mocks the cloud storage interactions.
// In a real app, this would use `gapi.client.drive` for Google Drive
// and the Alibaba Cloud SDK for ADrive.

const STORAGE_KEY_PROVIDERS = 'omni_providers';
const STORAGE_KEY_ASSETS = 'omni_assets';

export class StorageService {
  
  // --- Google Drive Simulation (Config Storage) ---

  static async loadProvidersFromDrive(): Promise<ProviderConfig[]> {
    // Mock latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Attempt to load from localStorage as a cache for the "Drive" file
    const stored = localStorage.getItem(STORAGE_KEY_PROVIDERS);
    return stored ? JSON.parse(stored) : [];
  }

  static async saveProviderToDrive(provider: ProviderConfig): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const current = await this.loadProvidersFromDrive();
    const index = current.findIndex(p => p.id === provider.id);
    
    let updated;
    if (index >= 0) {
        // Update existing
        updated = [...current];
        updated[index] = provider;
        console.log(`[Google Drive] Updated config: ${provider.name}`);
    } else {
        // Create new
        updated = [...current, provider];
        console.log(`[Google Drive] Created config: ${provider.name}`);
    }
    
    localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(updated));
  }

  static async saveAllProviders(providers: ProviderConfig[]): Promise<void> {
    // Mock latency for a bulk operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(providers));
    console.log(`[Google Drive] Bulk saved ${providers.length} configs`);
  }

  static async deleteProviderFromDrive(providerId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const current = await this.loadProvidersFromDrive();
    const updated = current.filter(p => p.id !== providerId);
    
    localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(updated));
    console.log(`[Google Drive] Deleted config ID: ${providerId}`);
  }

  static async readPromptsFromSheet(fileId: string): Promise<string[]> {
    console.log(`[Google Drive] Reading Sheet ID: ${fileId}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock data returned from a "Sheet"
    return [
      "一座赛博朋克风格的未来城市，霓虹灯闪烁，逼真，8k分辨率",
      "一个宁静的禅意花园，里面有一个机器人在修剪植物",
      "宇航员在火星上骑马",
      "漂浮在虚空中的抽象几何形状",
      "一只穿着维多利亚时代西装的猫的肖像"
    ];
  }

  // --- ADrive Simulation (Asset Storage) ---

  static async uploadAssetToADrive(asset: GeneratedAsset): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In reality, we would upload the binary blob to ADrive here.
    // We will save metadata to local storage to simulate a library.
    const stored = localStorage.getItem(STORAGE_KEY_ASSETS);
    const assets = stored ? JSON.parse(stored) : [];
    assets.push(asset);
    localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));
    
    console.log(`[ADrive] Uploaded asset: ${asset.url}`);
    return `adrive://assets/${asset.id}`;
  }

  static getSavedAssets(): GeneratedAsset[] {
    const stored = localStorage.getItem(STORAGE_KEY_ASSETS);
    return stored ? JSON.parse(stored) : [];
  }
}