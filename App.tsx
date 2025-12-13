import React, { useEffect, useState } from 'react';
import { ProviderConfig } from './types';
import { StorageService } from './services/storageService';
import { ProviderManager } from './components/ProviderManager';
import { Playground } from './components/Playground';
import { BatchGenerator } from './components/BatchGenerator';
import { Layers, Terminal, Server, LayoutGrid } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight hidden sm:block">OmniModel <span className="text-slate-500 font-normal">Hub</span></h1>
            <h1 className="font-bold text-lg tracking-tight sm:hidden">Omni</h1>
          </div>
          
          <nav className="flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setActiveTab('manager')}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'manager' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <Server className="w-4 h-4" /> <span className="hidden sm:inline">服务商</span>
            </button>
            <button 
              onClick={() => setActiveTab('playground')}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'playground' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <Terminal className="w-4 h-4" /> <span className="hidden sm:inline">演练场</span>
            </button>
            <button 
              onClick={() => setActiveTab('batch')}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'batch' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">云盘</span>
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Drive 已连接
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 overflow-y-auto overflow-x-hidden">
        {activeTab === 'manager' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ProviderManager />
          </div>
        )}

        {activeTab === 'playground' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 h-full">
            <Playground providers={providers} />
          </div>
        )}

        {activeTab === 'batch' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <BatchGenerator providers={providers} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;