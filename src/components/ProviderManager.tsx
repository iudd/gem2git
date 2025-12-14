import React, { useState } from 'react';
import { ProviderConfig } from '../types';
import { StorageService } from '../services/storageService';
import { Plus, Settings, Trash2, Shield, Zap, Brain, Cloud } from 'lucide-react';

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

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'openai': return <Zap className="w-5 h-5 text-green-400" />;
      case 'anthropic': return <Brain className="w-5 h-5 text-orange-400" />;
      case 'google': return <Cloud className="w-5 h-5 text-blue-400" />;
      case 'azure': return <Shield className="w-5 h-5 text-purple-400" />;
      default: return <Zap className="w-5 h-5 text-gray-400" />;
    }
  };

  const getProviderGradient = (type: string) => {
    switch (type) {
      case 'openai': return 'from-green-500/20 to-emerald-600/20 border-green-500/30';
      case 'anthropic': return 'from-orange-500/20 to-red-600/20 border-orange-500/30';
      case 'google': return 'from-blue-500/20 to-cyan-600/20 border-blue-500/30';
      case 'azure': return 'from-purple-500/20 to-pink-600/20 border-purple-500/30';
      default: return 'from-gray-500/20 to-slate-600/20 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">服务商管理</h2>
          <p className="text-slate-400 mt-1">配置和管理您的AI服务商</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-5 h-5" /> 添加服务商
        </button>
      </div>

      {isAdding && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-2xl shadow-slate-900/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold">添加新服务商</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">服务商名称</label>
              <input
                type="text"
                placeholder="例如：OpenAI GPT-4"
                value={newProvider.name}
                onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">服务商类型</label>
              <select
                value={newProvider.type}
                onChange={(e) => setNewProvider({ ...newProvider, type: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="azure">Azure</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-300">API Key</label>
              <input
                type="password"
                placeholder="输入您的API密钥"
                value={newProvider.apiKey}
                onChange={(e) => setNewProvider({ ...newProvider, apiKey: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 hover:text-white transition-all duration-200"
            >
              取消
            </button>
            <button
              onClick={addProvider}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-medium shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200"
            >
              添加服务商
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => (
          <div key={provider.id} className={`group relative bg-gradient-to-br ${getProviderGradient(provider.type)} backdrop-blur-xl p-6 rounded-2xl border shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${provider.enabled ? 'shadow-blue-500/10' : 'shadow-slate-900/50'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${provider.enabled ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/25' : 'bg-slate-700'}`}>
                  {getProviderIcon(provider.type)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors duration-200">{provider.name}</h3>
                  <p className="text-slate-400 text-sm uppercase tracking-wide">{provider.type}</p>
                </div>
              </div>
              <button
                onClick={() => toggleProvider(provider.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${provider.enabled ? 'bg-green-500' : 'bg-slate-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${provider.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${provider.enabled ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className={`text-sm font-medium ${provider.enabled ? 'text-green-400' : 'text-red-400'}`}>
                  {provider.enabled ? '已启用' : '已禁用'}
                </span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors duration-200">
                  <Settings className="w-4 h-4 text-slate-400 hover:text-white" />
                </button>
                <button
                  onClick={() => deleteProvider(provider.id)}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-300 mb-2">还没有服务商</h3>
          <p className="text-slate-500 mb-6">添加您的第一个AI服务商开始使用</p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-105"
          >
            添加服务商
          </button>
        </div>
      )}
    </div>
  );
};

export { ProviderManager };