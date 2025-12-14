import React, { useState, useEffect, useRef } from 'react';
import { ModelType, ProviderConfig } from '../types';
import { ApiService } from '../services/apiService';
import { StorageService, CloudConfig } from '../services/storageService';
import { Save, Server, CheckCircle, XCircle, Loader2, RefreshCw, List, Edit2, Trash2, Plus, Cloud, Globe, Keyboard, MousePointer2, AlertTriangle, Download, Upload, HardDrive, Settings, ArrowUpCircle, ArrowDownCircle, Copy, Database } from 'lucide-react';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export const ProviderManager: React.FC = () => {
  // Form State
  const [formData, setFormData] = useState({
    id: '', // Empty means new
    name: '',
    baseUrl: DEFAULT_BASE_URL,
    apiKey: '',
    type: ModelType.TEXT,
    modelName: 'gpt-3.5-turbo',
  });
  
  // App State
  const [savedProviders, setSavedProviders] = useState<ProviderConfig[]>([]);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error' | 'loading_list'>('idle');
  const [msg, setMsg] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // Model fetching state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelFetchStatus, setModelFetchStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Cloud Sync State
  const [showCloudConfig, setShowCloudConfig] = useState(false);
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>({ binId: '', apiKey: '' });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'uploading' | 'downloading'>('idle');
  
  // Controls whether we show a dropdown or a text input
  const [inputMode, setInputMode] = useState<'select' | 'text'>('text');

  // Hidden file input for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load providers and cloud config on mount
  useEffect(() => {
    loadProviders();
    const cc = StorageService.getCloudConfig();
    if (cc) setCloudConfig(cc);
  }, []);

  // Update input mode based on available models
  useEffect(() => {
    if (availableModels.length > 0) {
        setInputMode('select');
    } else {
        setInputMode('text');
    }
  }, [availableModels]);

  const loadProviders = async () => {
    setStatus('loading_list');
    const providers = await StorageService.loadProvidersFromDrive();
    setSavedProviders(providers);
    setStatus('idle');
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      baseUrl: DEFAULT_BASE_URL,
      apiKey: '',
      type: ModelType.TEXT,
      modelName: 'gpt-3.5-turbo',
    });
    setMsg('');
    setStatus('idle');
    setAvailableModels([]);
    setModelFetchStatus('idle');
  };

  const handleEdit = (provider: ProviderConfig) => {
    setFormData({
      id: provider.id,
      name: provider.name,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      type: provider.type,
      modelName: provider.modelName,
    });
    // Reset fetch status when editing
    setAvailableModels([]);
    setModelFetchStatus('idle');
    setMsg('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个服务商配置吗？')) {
      await StorageService.deleteProviderFromDrive(id);
      await loadProviders();
      if (formData.id === id) {
        resetForm();
      }
      // Dispatch event to update other components
      window.dispatchEvent(new Event('provider-updated'));
    }
  };

  const fetchModels = async () => {
    if (!formData.baseUrl || !formData.apiKey) {
      setMsg('请先填写 Base URL 和 API Key');
      setStatus('error');
      return;
    }

    setIsLoadingModels(true);
    setMsg('');
    try {
      const models = await ApiService.getModels(formData.baseUrl, formData.apiKey);
      if (models.length > 0) {
        setAvailableModels(models);
        setModelFetchStatus('success');
        if (!models.includes(formData.modelName)) {
            setFormData(prev => ({ ...prev, modelName: models[0] }));
        }
      } else {
        setAvailableModels([]);
        setModelFetchStatus('error');
        setMsg('未获取到模型列表，请手动输入');
      }
    } catch (e) {
      setAvailableModels([]);
      setModelFetchStatus('error');
      setMsg('获取模型列表失败，请手动输入');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const testConnection = async () => {
    setStatus('testing');
    setMsg('正在测试连接...');
    
    const config: ProviderConfig = {
      ...formData,
      id: formData.id || 'temp',
      createdAt: Date.now(),
    };

    const success = await ApiService.testConnection(config);
    if (success) {
      setStatus('success');
      setMsg('连接成功！');
    } else {
      setStatus('error');
      setMsg('连接失败，请检查配置。');
    }
  };

  const saveProvider = async () => {
    if (!formData.name || !formData.baseUrl || !formData.apiKey) {
      setMsg('请填写所有必填字段');
      setStatus('error');
      return;
    }

    setIsAutoSaving(true);
    
    const newProvider: ProviderConfig = {
      ...formData,
      id: formData.id || crypto.randomUUID(),
      createdAt: formData.id ? (savedProviders.find(p => p.id === formData.id)?.createdAt || Date.now()) : Date.now(),
    };

    await StorageService.saveProviderToDrive(newProvider);
    await loadProviders();
    
    setIsAutoSaving(false);
    setMsg(formData.id ? '更新成功' : '保存成功');
    setStatus('success');
    
    if (!formData.id) {
        resetForm();
    }
    
    // Dispatch event to update other components
    window.dispatchEvent(new Event('provider-updated'));
  };

  // --- Backup & Restore Logic ---

  const handleBackup = () => {
    const dataStr = JSON.stringify(savedProviders, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `omni_models_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (Array.isArray(parsed)) {
            const valid = parsed.every(p => p.id && p.name && p.baseUrl && p.apiKey && p.type);
            if (valid) {
                if(window.confirm(`确认导入 ${parsed.length} 个配置吗？这将覆盖现有列表。`)) {
                    setStatus('loading_list');
                    await StorageService.saveAllProviders(parsed);
                    await loadProviders();
                    window.dispatchEvent(new Event('provider-updated'));
                    alert("导入成功！");
                }
            } else {
                alert("文件格式不正确：缺少必要字段");
            }
        } else {
            alert("文件格式不正确：必须是配置数组");
        }
      } catch (err) {
        console.error(err);
        alert("无法解析 JSON 文件");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // --- Cloud Sync Logic ---

  const handleSaveCloudConfig = () => {
      if (!cloudConfig.binId || !cloudConfig.apiKey) {
          alert("请输入 Bin ID 和 API Key");
          return;
      }
      StorageService.saveCloudConfig(cloudConfig);
      setShowCloudConfig(false);
      alert("云端配置已保存");
  };

  const handleSyncToCloud = async () => {
      if (!cloudConfig.binId) {
          setShowCloudConfig(true);
          return;
      }
      if (!window.confirm("确定要将本地配置上传到云端吗？这将覆盖云端现有数据。")) return;

      setSyncStatus('uploading');
      try {
          // Pass the current state directly to ensure it works even if not "Saved" to LocalStorage
          const res = await StorageService.syncToCloud(cloudConfig);
          
          // Also save it locally since it worked
          StorageService.saveCloudConfig(cloudConfig);
          
          alert(`上传成功！(ID: ${res.updatedAt})`);
      } catch (e: any) {
          alert(`上传失败: ${e.message}`);
      } finally {
          setSyncStatus('idle');
      }
  };

  const handleSyncFromCloud = async () => {
      if (!cloudConfig.binId) {
          setShowCloudConfig(true);
          return;
      }
      if (!window.confirm("确定要从云端下载配置吗？这将覆盖本地现有数据。")) return;

      setSyncStatus('downloading');
      try {
          // Pass the current state directly
          const success = await StorageService.syncFromCloud(cloudConfig);
          if (success) {
              await loadProviders();
              
              // Also save config locally since it worked
              StorageService.saveCloudConfig(cloudConfig);

              window.dispatchEvent(new Event('provider-updated'));
              alert("同步成功！");
          }
      } catch (e: any) {
          alert(`同步失败: ${e.message}`);
      } finally {
          setSyncStatus('idle');
      }
  };

  // Helper: Copy valid JSON template to clipboard for manual JSONBin creation
  const handleCopyTemplate = () => {
      const template = {
          updatedAt: Date.now(),
          providers: [
              {
                  id: "demo-provider-1",
                  name: "Demo Text Provider",
                  baseUrl: "https://api.openai.com/v1",
                  apiKey: "sk-demo-key...",
                  type: "text",
                  modelName: "gpt-3.5-turbo",
                  createdAt: Date.now()
              }
          ],
          assets: []
      };
      navigator.clipboard.writeText(JSON.stringify(template, null, 2));
      alert("JSON 模板已复制到剪贴板！\n\n如果 '下载同步' 失败，请尝试登录 JSONBin.io，将此内容粘贴到你的 Bin 中保存，然后再试。");
  };

  // Helper: Load dummy data into local storage to test uploading
  const handleLoadTestData = async () => {
      if(window.confirm("这将清空当前列表并加载 2 个测试数据，用于测试'上传云端'功能。继续吗？")) {
          setStatus('loading_list');
          const demoData: ProviderConfig[] = [
              {
                  id: crypto.randomUUID(),
                  name: "Test GPT (Demo)",
                  baseUrl: "https://api.openai.com/v1",
                  apiKey: "sk-test-123456",
                  type: ModelType.TEXT,
                  modelName: "gpt-3.5-turbo",
                  createdAt: Date.now()
              },
               {
                  id: crypto.randomUUID(),
                  name: "Test DALL-E (Demo)",
                  baseUrl: "https://api.openai.com/v1",
                  apiKey: "sk-test-123456",
                  type: ModelType.IMAGE,
                  modelName: "dall-e-3",
                  createdAt: Date.now()
              }
          ];
          await StorageService.saveAllProviders(demoData);
          await loadProviders();
          window.dispatchEvent(new Event('provider-updated'));
          setStatus('idle');
          alert("测试数据已加载。\n\n现在请配置好 Bin ID 和 API Key，然后点击 '上传云端' 进行测试。");
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
      
      {/* Left Sidebar: List & Tools */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h2 className="font-bold text-slate-100 flex items-center gap-2">
            <List className="w-4 h-4" /> 已保存配置
          </h2>
          <div className="flex gap-2">
            <button onClick={handleLoadTestData} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1 transition-colors border border-slate-700" title="生成测试数据">
               <Database className="w-3 h-3"/> 测试数据
            </button>
            <button onClick={resetForm} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors shadow-sm">
                <Plus className="w-3 h-3" /> 新建
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {status === 'loading_list' ? (
             <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500"/></div>
          ) : savedProviders.length === 0 ? (
             <div className="text-center text-slate-500 p-8 text-sm">暂无配置，请在右侧添加或点击“测试数据”</div>
          ) : (
             savedProviders.map(p => (
               <div 
                 key={p.id} 
                 onClick={() => handleEdit(p)}
                 className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-800 group relative ${formData.id === p.id ? 'bg-slate-800 border-blue-500/50 shadow-md' : 'bg-slate-950 border-slate-800'}`}
               >
                 <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-slate-200">{p.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                        p.type === ModelType.TEXT ? 'bg-blue-900/30 text-blue-400' :
                        p.type === ModelType.IMAGE ? 'bg-purple-900/30 text-purple-400' : 'bg-orange-900/30 text-orange-400'
                    }`}>
                        {p.type}
                    </span>
                 </div>
                 <div className="text-xs text-slate-500 truncate font-mono">{p.modelName}</div>
                 
                 <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    className="absolute right-2 bottom-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="删除"
                 >
                    <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))
          )}
        </div>

        {/* Tools Section (Backup & Cloud) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 space-y-4">
            
            {/* 1. File Backup */}
            <div>
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <HardDrive className="w-3 h-3" /> 本地备份
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={handleBackup}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs py-2 rounded-lg transition-colors"
                    >
                        <Download className="w-3 h-3" /> 导出
                    </button>
                    <button 
                        onClick={handleRestoreClick}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs py-2 rounded-lg transition-colors"
                    >
                        <Upload className="w-3 h-3" /> 导入
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
                </div>
            </div>

            {/* 2. Cloud Sync */}
            <div>
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <Cloud className="w-3 h-3" /> 云端同步 (JSONBin)
                    </div>
                    <button onClick={() => setShowCloudConfig(!showCloudConfig)} className="text-slate-500 hover:text-blue-400" title="配置云端密钥">
                        <Settings className="w-3 h-3" />
                    </button>
                </div>
                
                {/* Config Form (Toggle) */}
                {showCloudConfig && (
                    <div className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-2 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                            <div className="text-[10px] text-slate-400">JSONBin ID (Bin ID):</div>
                            <button onClick={handleCopyTemplate} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1" title="复制标准 JSON 模板">
                                <Copy className="w-3 h-3"/> 复制模板
                            </button>
                        </div>
                        <input 
                            placeholder="例如: 654a..." 
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            value={cloudConfig.binId}
                            onChange={(e) => setCloudConfig({...cloudConfig, binId: e.target.value})}
                        />
                        <div className="text-[10px] text-slate-400 mb-1">Master Key:</div>
                        <input 
                            type="password"
                            placeholder="例如: $2a$10$..." 
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            value={cloudConfig.apiKey}
                            onChange={(e) => setCloudConfig({...cloudConfig, apiKey: e.target.value})}
                        />
                        <button 
                            onClick={handleSaveCloudConfig}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 rounded"
                        >
                            保存配置
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={handleSyncToCloud}
                        disabled={syncStatus !== 'idle'}
                        className="flex items-center justify-center gap-2 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs py-2 rounded-lg transition-colors"
                    >
                         {syncStatus === 'uploading' ? <Loader2 className="w-3 h-3 animate-spin"/> : <ArrowUpCircle className="w-3 h-3" />} 上传云端
                    </button>
                    <button 
                        onClick={handleSyncFromCloud}
                        disabled={syncStatus !== 'idle'}
                        className="flex items-center justify-center gap-2 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 text-xs py-2 rounded-lg transition-colors"
                    >
                        {syncStatus === 'downloading' ? <Loader2 className="w-3 h-3 animate-spin"/> : <ArrowDownCircle className="w-3 h-3" />} 下载同步
                    </button>
                </div>
            </div>

        </div>
      </div>

      {/* Right Content: Form */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                {formData.id ? <Edit2 className="w-5 h-5 text-blue-500"/> : <Plus className="w-5 h-5 text-blue-500"/>}
                {formData.id ? '编辑配置' : '添加新服务商'}
            </h2>
            {status === 'success' && <span className="text-green-500 text-sm flex items-center gap-1 animate-in fade-in"><CheckCircle className="w-4 h-4"/> {msg}</span>}
            {status === 'error' && <span className="text-red-500 text-sm flex items-center gap-1 animate-in fade-in"><XCircle className="w-4 h-4"/> {msg}</span>}
        </div>

        <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                        <Keyboard className="w-3 h-3"/> 显示名称
                    </label>
                    <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        placeholder="例如: My GPT-4"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                        <MousePointer2 className="w-3 h-3"/> 模型类型
                    </label>
                    <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none appearance-none"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value as ModelType})}
                    >
                        <option value={ModelType.TEXT}>文本 (Text/Chat)</option>
                        <option value={ModelType.IMAGE}>图像 (Image Generation)</option>
                        <option value={ModelType.VIDEO}>视频 (Video Generation)</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3 h-3"/> API Base URL
                </label>
                <div className="relative">
                    <input 
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-blue-500 outline-none transition-all"
                        placeholder="https://api.openai.com/v1"
                        value={formData.baseUrl}
                        onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                    />
                    <div className="absolute right-3 top-2.5 text-xs text-slate-600 pointer-events-none hidden sm:block">
                        必须包含协议头 (http/https)
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                    <Server className="w-3 h-3"/> API Key
                </label>
                <input 
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-blue-500 outline-none transition-all"
                    placeholder="sk-..."
                    value={formData.apiKey}
                    onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                />
            </div>

            <div>
                <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-xs font-medium text-slate-400 flex items-center gap-1">
                        <Cloud className="w-3 h-3"/> 模型名称 (Model Name)
                    </label>
                    <button 
                        onClick={fetchModels} 
                        disabled={isLoadingModels || !formData.apiKey}
                        className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                            isLoadingModels ? 'text-blue-400' : 'text-blue-500 hover:text-blue-400 hover:bg-blue-900/20'
                        }`}
                    >
                        {isLoadingModels ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>}
                        {isLoadingModels ? '获取中...' : '自动获取列表'}
                    </button>
                </div>

                <div className="relative">
                    {inputMode === 'select' ? (
                        <div className="relative">
                            <select 
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white appearance-none focus:border-blue-500 outline-none"
                                value={formData.modelName}
                                onChange={(e) => setFormData({...formData, modelName: e.target.value})}
                            >
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <button 
                                onClick={() => setInputMode('text')}
                                className="absolute right-2 top-2 p-1 text-slate-500 hover:text-white"
                                title="切换为手动输入"
                            >
                                <Edit2 className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                             <input 
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-blue-500 outline-none"
                                placeholder="例如: gpt-4, dall-e-3"
                                value={formData.modelName}
                                onChange={(e) => setFormData({...formData, modelName: e.target.value})}
                            />
                            {availableModels.length > 0 && (
                                <button 
                                    onClick={() => setInputMode('select')}
                                    className="absolute right-2 top-2 p-1 text-slate-500 hover:text-white"
                                    title="切换为选择列表"
                                >
                                    <List className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {modelFetchStatus === 'error' && (
                     <div className="text-[10px] text-orange-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3"/> 无法自动获取模型列表，请手动输入。
                     </div>
                )}
            </div>

            <div className="pt-4 flex gap-4 border-t border-slate-800 mt-6">
                <button 
                    onClick={testConnection}
                    disabled={status === 'testing'}
                    className={`flex-1 py-3 rounded-lg font-bold border border-slate-700 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 ${status === 'testing' ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {status === 'testing' ? <Loader2 className="animate-spin w-4 h-4"/> : <Server className="w-4 h-4"/>}
                    测试连接
                </button>
                <button 
                    onClick={saveProvider}
                    disabled={status === 'testing' || isAutoSaving}
                    className="flex-[2] py-3 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                   {isAutoSaving ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
                   {formData.id ? '更新配置' : '保存配置'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};