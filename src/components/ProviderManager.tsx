import React, { useState } from 'react';
import { ProviderConfig } from '../types';
import { StorageService } from '../services/storageService';
import { Plus, Settings, Trash2 } from 'lucide-react';

const ProviderManager: React.FC = () => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newProvider, setNewProvider] = useState<Partial<ProviderConfig>>({
    name: '',
    type: 'openai',
    apiKey: '',
    enabled: false
  });

  const loadProviders = async () => {
    const loaded = await StorageService.loadProvidersFromDrive();
    setProviders(loaded);
  };

  React.useEffect(() => {
    loadProviders();
  }, []);

  const addProvider = async () => {
    if (!newProvider.name || !newProvider.apiKey) return;
    const provider: ProviderConfig = {
      id: Date.now().toString(),
      name: newProvider.name,
      type: newProvider.type as any,
      apiKey: newProvider.apiKey,
      enabled: newProvider.enabled || false
    };
    await StorageService.saveProvidersToDrive([...providers, provider]);
    setProviders([...providers, provider]);
    setIsAdding(false);
    setNewProvider({ name: '', type: 'openai', apiKey: '', enabled: false });
  };

  const deleteProvider = async (id: string) => {
    const updated = providers.filter(p => p.id !== id);
    await StorageService.saveProvidersToDrive(updated);
    setProviders(updated);
  };

  const toggleProvider = async (id: string) => {
    const updated = providers.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    await StorageService.saveProvidersToDrive(updated);
    setProviders(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">服务商管理</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          <Plus className="w-4 h-4" /> 添加服务商
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">添加新服务商</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="服务商名称"
              value={newProvider.name}
              onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            />
            <select
              value={newProvider.type}
              onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value as any })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="azure">Azure</option>
            </select>
            <input
              type="password"
              placeholder="API Key"
              value={newProvider.apiKey}
              onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white md:col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addProvider}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white"
            >
              添加
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{provider.name}</h3>
              <p className="text-slate-400">{provider.type.toUpperCase()}</p>
              <p className={`text-sm ${provider.enabled ? 'text-green-400' : 'text-red-400'}`}>
                {provider.enabled ? '启用' : '禁用'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleProvider(provider.id)}
                className={`px-3 py-1 rounded text-sm ${provider.enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'} text-white`}
              >
                {provider.enabled ? '禁用' : '启用'}
              </button>
              <button className="p-2 hover:bg-slate-700 rounded-md">
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteProvider(provider.id)}
                className="p-2 hover:bg-red-700 rounded-md text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { ProviderManager };</parameter