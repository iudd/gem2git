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
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Layers className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg">OmniModel Hub</h1>
          </div>
          
          <nav className="flex gap-1 bg-slate-700 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('manager')}
              className={`px-4 py-2 rounded text-sm transition-colors ${activeTab === 'manager' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            >
              <Server className="w-4 h-4 inline mr-1" /> 服务商
            </button>
            <button 
              onClick={() => setActiveTab('playground')}
              className={`px-4 py-2 rounded text-sm transition-colors ${activeTab === 'playground' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            >
              <Terminal className="w-4 h-4 inline mr-1" /> 演练场
            </button>
            <button 
              onClick={() => setActiveTab('batch')}
              className={`px-4 py-2 rounded text-sm transition-colors ${activeTab === 'batch' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4 inline mr-1" /> 云盘
            </button>
          </nav>

          <div className="text-sm text-green-400 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            Drive 已连接
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'manager' && <ProviderManager />}
        {activeTab === 'playground' && <Playground providers={providers} />}
        {activeTab === 'batch' && <BatchGenerator providers={providers} />}
      </main>
    </div>
  );
};

export default App;