import React, { useState } from 'react';
import { ProviderConfig, ModelType, BatchItem } from '../types';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { FileSpreadsheet, Play, Check, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';

interface BatchGeneratorProps {
  providers: ProviderConfig[];
}

export const BatchGenerator: React.FC<BatchGeneratorProps> = ({ providers }) => {
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [sheetId, setSheetId] = useState('1BxiMvs0XRA5nFNYry...'); 
  const [items, setItems] = useState<BatchItem[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading_sheet' | 'processing'>('idle');

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  const loadSheet = async () => {
    setStatus('loading_sheet');
    try {
      const prompts = await StorageService.readPromptsFromSheet(sheetId);
      setItems(prompts.map(p => ({ prompt: p, status: 'pending' })));
    } catch (e) {
      alert("读取 Sheet 失败");
    } finally {
      setStatus('idle');
    }
  };

  const runBatch = async () => {
    if (!selectedProvider) return;
    setStatus('processing');
    
    // Process sequentially to not hit rate limits easily
    const newItems = [...items];
    
    for (let i = 0; i < newItems.length; i++) {
        if (newItems[i].status === 'completed') continue;

        newItems[i].status = 'processing';
        setItems([...newItems]); // Update UI

        try {
            let result = '';
            if (selectedProvider.type === ModelType.IMAGE) {
                result = await ApiService.generateImage(selectedProvider, newItems[i].prompt);
            } else if (selectedProvider.type === ModelType.VIDEO) {
                result = await ApiService.generateVideo(selectedProvider, newItems[i].prompt);
            } else {
                // Text
                result = await ApiService.generateCompletion(selectedProvider, [{ role: 'user', content: newItems[i].prompt }]);
            }
            newItems[i].result = result;
            newItems[i].status = 'completed';
            
            // Auto save to ADrive simulation
            await StorageService.uploadAssetToADrive({
                id: crypto.randomUUID(),
                type: selectedProvider.type,
                url: result,
                prompt: newItems[i].prompt,
                createdAt: Date.now(),
                providerId: selectedProvider.id
            });

        } catch (e) {
            console.error(e);
            newItems[i].status = 'failed';
        }
        
        setItems([...newItems]); // Update UI
    }
    setStatus('idle');
  };

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet className="text-green-500 w-6 h-6"/>
            从云端硬盘批量生成
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
             <div className="md:col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Google Sheet ID (模拟)</label>
                <div className="flex gap-2">
                    <input 
                        value={sheetId} 
                        onChange={(e) => setSheetId(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                    />
                    <button 
                        onClick={loadSheet}
                        disabled={status !== 'idle'}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        {status === 'loading_sheet' ? <Loader2 className="animate-spin w-4 h-4"/> : '加载'}
                    </button>
                </div>
             </div>
             
             <div>
                <label className="text-xs text-slate-400 block mb-1">目标服务商</label>
                <select 
                    value={selectedProviderId}
                    onChange={(e) => setSelectedProviderId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                >
                    <option value="">选择服务商</option>
                    {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                    ))}
                </select>
             </div>
        </div>

        {items.length > 0 && (
            <div className="space-y-4">
                <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950 text-slate-400 font-medium">
                            <tr>
                                <th className="p-3">状态</th>
                                <th className="p-3">提示词</th>
                                <th className="p-3">结果</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                            {items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-3 w-32">
                                        {item.status === 'pending' && <span className="text-slate-500 flex items-center gap-1">等待中</span>}
                                        {item.status === 'processing' && <span className="text-blue-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> 处理中</span>}
                                        {item.status === 'completed' && <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3"/> 完成</span>}
                                        {item.status === 'failed' && <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> 失败</span>}
                                    </td>
                                    <td className="p-3 text-slate-300 truncate max-w-xs" title={item.prompt}>
                                        {item.prompt}
                                    </td>
                                    <td className="p-3">
                                        {item.result ? (
                                            selectedProvider?.type === ModelType.TEXT ? (
                                                <div className="max-w-[200px] truncate text-slate-400" title={item.result}>{item.result}</div>
                                            ) : (
                                                <a href={item.result} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                    查看资源 <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )
                                        ) : (
                                            <span className="text-slate-600">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={runBatch}
                        disabled={status === 'processing' || !selectedProvider}
                        className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${
                            status === 'processing' || !selectedProvider
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-500 text-white'
                        }`}
                    >
                        {status === 'processing' ? <Loader2 className="animate-spin w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                        执行批量任务
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};