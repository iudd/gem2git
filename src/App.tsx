import React, { useEffect, useState } from 'react';
import { ProviderConfig } from './types';
import { StorageService } from './services/storageService';
import { ProviderManager } from './components/ProviderManager';
import { Playground } from './components/Playground';
import { BatchGenerator } from './components/BatchGenerator';
import { Layers, Terminal, Server, LayoutGrid, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manager' | 'playground' | 'batch'>('manager');
  const [providers, setProviders] = useState<ProviderConfig[]>([]);

  const loadProviders = async () => {
    const loaded = await StorageService.loadProvidersFromDrive();
    setProviders(loaded);
  };

  useEffect(() => {
    loadProviders();

    // Listen for updates from the Manager component
    const handleUpdate = () => loadProviders();
    window.addEventListener('provider-updated', handleUpdate);
    return () => window.removeEventListener('provider-updated', handleUpdate);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-transparent via-blue-500/5 to-transparent rounded-full blur-3xl"></div>

      {/* Header */}
      <header className="relative border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl shadow-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                <Layers className="text-white w-6 h-6" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                OmniModel Hub
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">AI 模型交互平台</p>
            </div>
          </div>
          
          <nav className="flex gap-1 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800/50 backdrop-blur-sm shadow-lg shadow-slate-900/20">
            <button 
              onClick={() => setActiveTab('manager')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 relative group ${activeTab === 'manager' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Server className="w-4 h-4" /> 
              <span className="hidden sm:inline">服务商</span>
              {activeTab === 'manager' && <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400 animate-bounce" />}
            </button>
            <button 
              onClick={() => setActiveTab('playground')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 relative group ${activeTab === 'playground' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <Terminal className="w-4 h-4" /> 
              <span className="hidden sm:inline">演练场</span>
              {activeTab === 'playground' && <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400 animate-bounce" />}
            </button>
            <button 
              onClick={() => setActiveTab('batch')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 relative group ${activeTab === 'batch' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <LayoutGrid className="w-4 h-4" /> 
              <span className="hidden sm:inline">云盘</span>
              {activeTab === 'batch' && <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400 animate-bounce" />}
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
            <span className="text-xs text-green-400 font-medium">Drive 已连接</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full p-6 overflow-y-auto overflow-x-hidden">
        {activeTab === 'manager' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProviderManager />
          </div>
        )}

        {activeTab === 'playground' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
            <Playground providers={providers} />
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BatchGenerator providers={providers} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;