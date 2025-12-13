import React, { useState, useEffect, useRef } from 'react';
import { ModelType, ProviderConfig } from '../types';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { Save, Server, CheckCircle, XCircle, Loader2, RefreshCw, List, Edit2, Trash2, Plus, Cloud, Globe, Keyboard, MousePointer2, AlertTriangle, Download, Upload } from 'lucide-react';

export const ProviderManager: React.FC = () => {
  // Form State
  const [formData, setFormData] = useState({
    id: '', // Empty means new
    name: '',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    type: ModelType.TEXT,
    modelName: 'gpt-3.5-turbo',
  });
  
  // App State
  const [savedProviders, setSavedProviders] = useState<ProviderConfig[]>([]);
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error' | 'loading_list'>('idle');
  const [msg, setMsg] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  
  // Model fetching state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelFetchStatus, setModelFetchStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Controls whether we show a dropdown or a text input
  const [inputMode, setInputMode] = useState<'select' | 'text'>('text');

  // Hidden file input for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  // Update input mode based on available models
  useEffect(() => {
    if (availableModels.length > 0) {
        setInputMode('select');
    } else {
        setInputMode('text');
    }
  }, [availableModels]);

  // Auto-save effect for Storage (Simulating Google Drive Sync)
  useEffect(() => {
    // Only auto-save if we are editing an existing provider (has ID)
    // and have minimal required fields.
    if (!formData.id || !formData.name || !formData.apiKey) return;

    const timer = setTimeout(async () => {
        setIsAutoSaving(true);
        try {
            // Find existing to preserve createdAt, or default to now
            const existing = savedProviders.find(p => p.id === formData.id);
            const config: ProviderConfig = {
                ...formData,
                createdAt: existing ? existing.createdAt : Date.now(),
            };
            
            // Perform a silent save to storage (skip connection test for auto-save speed)
            await StorageService.saveProviderToDrive(config);
            
            // Update local list state to reflect changes immediately without full reload
            setSavedProviders(prev => prev.map(p => p.id === config.id ? config : p));
            setLastSavedTime(Date.now());
        } catch (e) {
            console.error("Auto-save failed", e);
        } finally {
            setIsAutoSaving(false);
        }
    }, 2000); // 2 seconds debounce for saving to drive

    return () => clearTimeout(timer);
  }, [formData]);

  // Auto-fetch models effect (Debounced)
  useEffect(() => {
    // Reset model status if fields are cleared
    if (!formData.baseUrl || !formData.apiKey) {
        setAvailableModels([]);
        setModelFetchStatus('idle');
        return;
    }

    const timer = setTimeout(() => {
        // Only fetch if we have valid-looking data
        if(formData.baseUrl.startsWith('http')) {
            fetchModels(true);
        }
    }, 800); // 800ms debounce to wait for typing to finish

    return () => clearTimeout(timer);
  }, [formData.baseUrl, formData.apiKey]);

  const generateId = () => {
    // Fallback for environments where crypto.randomUUID might be missing
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  };

  const loadProviders = async () => {
    setStatus('loading_list');
    const list = await StorageService.loadProvidersFromDrive();
    setSavedProviders(list);
    setStatus('idle');
  };

  const fetchModels = async (silent = false) => {
    if (!formData.baseUrl || !formData.apiKey) {
      if (!silent) {
        setMsg("请先填写 Base URL 和 API Key 以获取模型列表");
        setStatus('idle');
      }
      return;
    }

    setIsLoadingModels(true);
    setModelFetchStatus('idle');
    try {
      const models = await ApiService.getModels(formData.baseUrl, formData.apiKey);
      if (models.length > 0) {
        setAvailableModels(models);
        setModelFetchStatus('success');
        if (!silent) setMsg(`成功获取 ${models.length} 个模型`);
        
        // Only auto-fill if the current modelName is empty OR not in the list (optional logic)
        // But for UX, let's only do it if empty to avoid overwriting user progress
        if (!formData.modelName) {
           setFormData(prev => ({ ...prev, modelName: models[0] }));
        }
      } else {
        setModelFetchStatus('error');
        if (!silent) setMsg("未获取到模型列表，请手动输入");
        setAvailableModels([]);
      }
    } catch (e) {
      console.error(e);
      setModelFetchStatus('error');
      if (!silent) setMsg("获取模型列表失败");
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const saveConfig = async (config: ProviderConfig) => {
      await StorageService.saveProviderToDrive(config);
      
      setStatus('success');
      setMsg(formData.id ? '配置已更新。' : '成功保存到云端硬盘。');
      
      if (!formData.id) {
          // If it was new, switch to "Edit" mode for this new item so auto-save can take over
          setFormData(prev => ({ ...prev, id: config.id }));
      }
      
      // Refresh list and notify app
      await loadProviders();
      window.dispatchEvent(new Event('provider-updated'));
  };

  const handleTestAndSave = async () => {
    setStatus('testing');
    setMsg('正在测试连接...');

    try {
        // If editing, use existing ID, else generate new
        const configId = formData.id || generateId();

        const config: ProviderConfig = {
        ...formData,
        id: configId,
        createdAt: formData.id ? (savedProviders.find(p => p.id === formData.id)?.createdAt || Date.now()) : Date.now(),
        };

        const isConnected = await ApiService.testConnection(config);

        if (isConnected) {
            setMsg(formData.id ? '更新配置...' : '连接成功！正在保存...');
            await saveConfig(config);
        } else {
            setStatus('error');
            setMsg('连接测试失败。您可以尝试强制保存。');
        }
    } catch (error) {
        console.error("Test save error", error);
        setStatus('error');
        setMsg('操作发生异常。');
    }
  };

  const handleForceSave = async () => {
      setStatus('testing'); // Show spinner briefly
      setMsg('正在强制保存...');
      
      try {
        const configId = formData.id || generateId();
        const config: ProviderConfig = {
            ...formData,
            id: configId,
            createdAt: formData.id ? (savedProviders.find(p => p.id === formData.id)?.createdAt || Date.now()) : Date.now(),
        };
        await saveConfig(config);
      } catch (e) {
        setStatus('error');
        setMsg('保存失败。');
      }
  };

  const handleEdit = (provider: ProviderConfig) => {
      setFormData({
          id: provider.id,
          name: provider.name,
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey,
          type: provider.type,
          modelName: provider.modelName
      });
      // Clear models list initially so we fetch fresh for this provider
      setAvailableModels([]); 
      setInputMode('text');
      setModelFetchStatus('idle');
      setMsg('');
      setStatus('idle');
      setLastSavedTime(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("确定要删除此配置吗？")) {
          await StorageService.deleteProviderFromDrive(id);
          if (formData.id === id) resetForm();
          await loadProviders();
          window.dispatchEvent(new Event('provider-updated'));
      }
  };

  const resetForm = () => {
      setFormData({
        id: '',
        name: '',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        type: ModelType.TEXT,
        modelName: 'gpt-3.5-turbo',
      });
      setMsg('');
      setStatus('idle');
      setAvailableModels([]);
      setInputMode('text');
      setModelFetchStatus('idle');
      setLastSavedTime(null);
  };

  // --- Export / Import Logic ---

  const handleExport = () => {
    if (savedProviders.length === 0) {
        alert("没有可导出的配置。");
        return;
    }
    const dataStr = JSON.stringify(savedProviders, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `omnimodel-providers-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = e.target?.result as string;
            const parsedData = JSON.parse(content);

            if (!Array.isArray(parsedData)) {
                throw new Error("导入文件格式无效：应为配置数组。");
            }

            // Basic validation
            const validConfigs = parsedData.filter((item: any) => 
                item.id && item.name && item.baseUrl && item.apiKey
            );

            if (validConfigs.length === 0) {
                throw new Error("未找到有效的服务商配置数据。");
            }

            setStatus('loading_list');
            
            // Merge strategy: Overwrite duplicates by ID, keep others
            // Using a Map to handle uniqueness based on ID
            const mergedMap = new Map<string, ProviderConfig>();
            savedProviders.forEach(p => mergedMap.set(p.id, p));
            validConfigs.forEach(p => mergedMap.set(p.id, p));
            
            const mergedList = Array.from(mergedMap.values());
            
            await StorageService.saveAllProviders(mergedList);
            await loadProviders();
            window.dispatchEvent(new Event('provider-updated'));
            
            alert(`成功导入 ${validConfigs.length} 个配置！`);
            
        } catch (error: any) {
            console.error("Import failed", error);
            alert("导入失败: " + error.message);
        } finally {
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
            setStatus('idle');
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pb-10">
      {/* Sidebar List */}
      <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-56 md:h-[600px] shadow-lg">
         <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-900 z-10 pb-2 border-b border-slate-800">
             <h3 className="font-bold text-slate-200">已保存配置</h3>
             <div className="flex gap-1">
                 <button 
                    onClick={handleExport} 
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white" 
                    title="导出配置 JSON"
                 >
                     <Download className="w-4 h-4" />
                 </button>
                 <button 
                    onClick={handleImportClick} 
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white" 
                    title="导入配置 JSON"
                 >
                     <Upload className="w-4 h-4" />
                 </button>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                 />
                 <div className="w-px h-6 bg-slate-800 mx-1 self-center"></div>
                 <button onClick={resetForm} className="p-2 hover:bg-slate-800 rounded-full transition-colors" title="新建配置">
                     <Plus className="w-4 h-4 text-blue-400" />
                 </button>
             </div>
         </div>
         
         <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
             {status === 'loading_list' ? (
                 <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-600"/></div>
             ) : savedProviders.length === 0 ? (
                 <div className="text-center py-10 text-slate-600 text-sm">暂无配置<br/>请在右侧添加</div>
             ) : (
                 savedProviders.map(p => (
                     <div 
                        key={p.id} 
                        onClick={() => handleEdit(p)}
                        className={`group p-3 rounded-lg border cursor-pointer transition-all ${
                            formData.id === p.id 
                            ? 'bg-blue-900/20 border-blue-500/50' 
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                     >
                         <div className="flex justify-between items-start">
                             <div className="flex-1 min-w-0">
                                 <div className={`text-sm font-medium truncate ${formData.id === p.id ? 'text-blue-300' : 'text-slate-300'}`}>
                                     {p.name}
                                 </div>
                                 <div className="text-xs text-slate-500 truncate mt-1">{p.modelName}</div>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                 <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                                     p.type === ModelType.TEXT ? 'bg-blue-500/20 text-blue-400' :
                                     p.type === ModelType.IMAGE ? 'bg-purple-500/20 text-purple-400' :
                                     'bg-orange-500/20 text-orange-400'
                                 }`}>{p.type}</span>
                                 <button 
                                    onClick={(e) => handleDelete(p.id, e)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-600 transition-all"
                                 >
                                     <Trash2 className="w-3 h-3" />
                                 </button>
                             </div>
                         </div>
                     </div>
                 ))
             )}
         </div>
      </div>

      {/* Main Form */}
      <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative transition-all">
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg ${formData.id ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
            {formData.id ? <Edit2 className="w-6 h-6 text-amber-500" /> : <Server className="w-6 h-6 text-blue-500" />}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">
                        {formData.id ? '编辑服务商配置' : '添加自定义服务商'}
                    </h2>
                    {/* Auto-save Indicator (Google Drive Simulation) */}
                    {formData.id && (
                        <div className="flex items-center gap-1 ml-2 text-xs transition-opacity duration-500">
                             {isAutoSaving ? (
                                 <span className="text-blue-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> 云端同步中...</span>
                             ) : lastSavedTime ? (
                                 <span className="text-slate-500 flex items-center gap-1"><Cloud className="w-3 h-3"/> 已同步</span>
                             ) : null}
                        </div>
                    )}
                </div>
                <p className="text-slate-400 text-sm">
                    {formData.id ? '修改现有连接参数' : '配置兼容 OpenAI 格式的接口'}
                </p>
            </div>
            {formData.id && (
                <button onClick={resetForm} className="ml-auto text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full whitespace-nowrap">
                    <Plus className="w-3 h-3"/> 新建
                </button>
            )}
        </div>

        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">服务商名称</label>
                <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="例如：我的自定义 LLM"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">服务类型</label>
                <select
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ModelType })}
                >
                <option value={ModelType.TEXT}>文本 / 对话</option>
                <option value={ModelType.IMAGE}>图像生成</option>
                <option value={ModelType.VIDEO}>视频生成</option>
                </select>
            </div>
            </div>

            <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3"/> 基础 URL (Base URL)
            </label>
            <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                placeholder="https://api.openai.com/v1"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                // removed onBlur, using debounce effect instead
            />
            </div>

            <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">API 密钥</label>
            <input
                type="password"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                placeholder="sk-..."
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                // removed onBlur, using debounce effect instead
            />
            </div>

            <div className="relative">
                <div className="flex justify-between items-end mb-1">
                    <label className="block text-xs font-medium text-slate-400">模型名称 (ID)</label>
                    <div className="flex items-center gap-3">
                        {/* Status Message */}
                        {isLoadingModels && (
                            <span className="text-[10px] text-blue-400 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin"/> 获取列表...
                            </span>
                        )}
                        {!isLoadingModels && modelFetchStatus === 'success' && availableModels.length > 0 && (
                            <span className="text-[10px] text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full animate-in fade-in">
                                <CheckCircle className="w-3 h-3"/> 已发现 {availableModels.length} 个
                            </span>
                        )}
                        {!isLoadingModels && modelFetchStatus === 'error' && (
                             <span className="text-[10px] text-red-400 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full animate-in fade-in">
                                <XCircle className="w-3 h-3"/> 获取失败
                            </span>
                        )}

                        {/* Toggle Input Mode */}
                        {availableModels.length > 0 && (
                            <button
                                onClick={() => setInputMode(prev => prev === 'select' ? 'text' : 'select')}
                                className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors bg-slate-800/50 px-2 py-0.5 rounded"
                                title={inputMode === 'select' ? "切换到手动输入" : "切换到列表选择"}
                            >
                                {inputMode === 'select' ? <Keyboard size={12}/> : <MousePointer2 size={12}/>}
                                {inputMode === 'select' ? "手动输入" : "列表选择"}
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        {inputMode === 'select' && availableModels.length > 0 ? (
                            <div className="relative">
                                <select
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm appearance-none"
                                    value={formData.modelName}
                                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                >
                                    {availableModels.map((model) => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <List className="w-4 h-4" />
                                </div>
                            </div>
                        ) : (
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                                placeholder="例如：gpt-4, stable-diffusion-xl"
                                value={formData.modelName}
                                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                                onFocus={() => {
                                    if (availableModels.length === 0 && formData.apiKey) {
                                        fetchModels(true);
                                    }
                                }}
                            />
                        )}
                    </div>
                    <button 
                        onClick={() => fetchModels(false)}
                        disabled={isLoadingModels || !formData.apiKey}
                        className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 px-3 rounded-lg transition-colors border border-slate-700"
                        title="强制刷新模型列表"
                    >
                        {isLoadingModels ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>}
                    </button>
                </div>
            </div>

            <div className="pt-4 flex gap-3">
                <button
                    onClick={handleTestAndSave}
                    disabled={status === 'testing' || !formData.apiKey || !formData.baseUrl}
                    className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    status === 'testing' ? 'bg-slate-800 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white'
                    }`}
                >
                    {status === 'testing' ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {formData.id ? '保存并测试连接' : '测试并保存'}
                </button>
                
                {/* Force Save Button (Shown on Error) */}
                {status === 'error' && (
                     <button
                        onClick={handleForceSave}
                        className="px-4 py-3 rounded-lg font-medium bg-orange-600/20 text-orange-400 border border-orange-600/50 hover:bg-orange-600/30 transition-all flex items-center gap-2 whitespace-nowrap"
                        title="跳过测试直接保存"
                    >
                        <AlertTriangle className="w-5 h-5" />
                        强制保存
                    </button>
                )}
            </div>

            {/* General Status Message (Connection Test) */}
            {status !== 'idle' && status !== 'loading_list' && (
            <div className={`flex items-center gap-3 p-3 rounded-lg border animate-in slide-in-from-top-2 ${
                status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
                {status === 'success' ? <CheckCircle className="w-5 h-5" /> : 
                status === 'error' ? <XCircle className="w-5 h-5" /> : 
                <Loader2 className="w-5 h-5 animate-spin" />}
                <span className="text-sm">{msg}</span>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};