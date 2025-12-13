import React, { useState, useEffect, useRef } from 'react';
import { ProviderConfig, ModelType, ChatMessage, GeneratedAsset } from '../types';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { Send, Image as ImageIcon, Video, MessageSquare, CloudUpload, AlertCircle, Settings2, ChevronDown, ChevronUp, User, Bot } from 'lucide-react';

interface PlaygroundProps {
  providers: ProviderConfig[];
}

export const Playground: React.FC<PlaygroundProps> = ({ providers }) => {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done'>('idle');

  // Advanced Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [imageSize, setImageSize] = useState("1024x1024");
  const [imageQuality, setImageQuality] = useState("standard");

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const selectedProvider = providers.find(p => p.id === selectedProviderId);

  useEffect(() => {
    if (providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id);
    }
  }, [providers, selectedProviderId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, selectedProviderId]);

  const handleSend = async () => {
    if (!selectedProvider || !prompt) return;

    setLoading(true);
    setResultUrl(null);
    setUploadStatus('idle');

    try {
      if (selectedProvider.type === ModelType.TEXT) {
        const newMsg: ChatMessage = { role: 'user', content: prompt, timestamp: Date.now() };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        setPrompt(''); // Clear input for chat
        
        const responseText = await ApiService.generateCompletion(
          selectedProvider, 
          updatedMessages.map(m => ({ role: m.role, content: m.content })),
          { temperature }
        );
        
        setMessages(prev => [...prev, { role: 'assistant', content: responseText, timestamp: Date.now() }]);
      } 
      else if (selectedProvider.type === ModelType.IMAGE) {
        const url = await ApiService.generateImage(selectedProvider, prompt, {
            size: imageSize,
            quality: imageQuality
        });
        setResultUrl(url);
      } 
      else if (selectedProvider.type === ModelType.VIDEO) {
        const url = await ApiService.generateVideo(selectedProvider, prompt);
        setResultUrl(url);
      }
    } catch (error: any) {
      alert(`错误: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToADrive = async () => {
    if (!selectedProvider) return;
    
    // Determine what to save
    let assetUrl = resultUrl;
    let contentPrompt = prompt;

    // If text, we might save the transcript as a text file asset, but for this demo let's focus on media
    if (selectedProvider.type === ModelType.TEXT) {
       alert("文本记录保存功能暂未开放。");
       return;
    }

    if (assetUrl) {
      setUploadStatus('uploading');
      try {
        const asset: GeneratedAsset = {
          id: crypto.randomUUID(),
          type: selectedProvider.type,
          url: assetUrl,
          prompt: selectedProvider.type === ModelType.TEXT ? '' : contentPrompt || '生成的资源',
          createdAt: Date.now(),
          providerId: selectedProvider.id
        };
        await StorageService.uploadAssetToADrive(asset);
        setUploadStatus('done');
      } catch (e) {
        console.error(e);
        alert("上传到阿里云盘失败");
        setUploadStatus('idle');
      }
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <AlertCircle className="w-12 h-12 mb-2" />
        <p>未配置服务商。请在管理页签中添加。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Controls */}
      <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">选择服务商</label>
          <select 
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-colors"
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
          >
            {providers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.type === 'text' ? '文本' : p.type === 'image' ? '图像' : '视频'} - {p.modelName})
              </option>
            ))}
          </select>
        </div>

        {/* Settings Toggle */}
        <div className="border-b border-slate-800 pb-2">
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors w-full"
            >
                <Settings2 className="w-4 h-4" />
                高级设置
                {showSettings ? <ChevronUp className="w-3 h-3 ml-auto"/> : <ChevronDown className="w-3 h-3 ml-auto"/>}
            </button>
        </div>

        {/* Settings Panel */}
        {showSettings && selectedProvider && (
            <div className="space-y-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
                {selectedProvider.type === ModelType.TEXT && (
                    <div>
                        <div className="flex justify-between mb-1">
                            <label className="text-xs text-slate-400">温度 (Temperature): {temperature}</label>
                        </div>
                        <input 
                            type="range" min="0" max="2" step="0.1" 
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                )}
                {selectedProvider.type === ModelType.IMAGE && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">尺寸</label>
                            <select 
                                value={imageSize}
                                onChange={(e) => setImageSize(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded text-xs p-2 text-white outline-none"
                            >
                                <option value="1024x1024">1024x1024</option>
                                <option value="512x512">512x512</option>
                                <option value="256x256">256x256</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">质量</label>
                            <select 
                                value={imageQuality}
                                onChange={(e) => setImageQuality(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded text-xs p-2 text-white outline-none"
                            >
                                <option value="standard">Standard</option>
                                <option value="hd">HD</option>
                            </select>
                        </div>
                    </div>
                )}
                {selectedProvider.type === ModelType.VIDEO && (
                    <div className="text-xs text-slate-500 italic">
                        视频生成暂时仅支持提示词参数。
                    </div>
                )}
            </div>
        )}

        {selectedProvider?.type !== ModelType.TEXT && (
          <div className="flex-1">
             <label className="block text-xs font-medium text-slate-400 mb-2">提示词 (Prompt)</label>
             <textarea 
               className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-white resize-none focus:border-blue-500 outline-none"
               placeholder={`描述你想生成的${selectedProvider?.type === 'image' ? '图片' : '视频'}...`}
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
             />
          </div>
        )}
        
        {selectedProvider?.type === ModelType.TEXT && (
           <div 
             ref={chatContainerRef}
             className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-y-auto space-y-6 custom-scrollbar scroll-smooth"
           >
             {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-50"/>
                    <p className="text-sm">开始对话...</p>
                </div>
             )}
             {messages.map((m, i) => (
               <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                 <div className={`flex items-end gap-2 max-w-[90%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar Icon */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                        {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    </div>

                    {/* Bubble */}
                    <div className={`rounded-2xl px-4 py-3 text-sm shadow-md leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                    }`}>
                        {m.content}
                    </div>
                 </div>
                 
                 {/* Timestamp & Role Label */}
                 <div className={`mt-1 flex items-center gap-2 text-[10px] text-slate-500 ${m.role === 'user' ? 'mr-10' : 'ml-10'}`}>
                    <span className="uppercase font-bold tracking-wider opacity-70">{m.role}</span>
                    <span>•</span>
                    <span className="font-mono">{formatTime(m.timestamp)}</span>
                 </div>
               </div>
             ))}
           </div>
        )}

        <div className="mt-auto pt-2">
            {selectedProvider?.type === ModelType.TEXT && (
              <div className="flex gap-2 mb-2">
                 <input 
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                    placeholder="输入消息..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 />
              </div>
            )}
            
            <button 
              onClick={handleSend}
              disabled={loading || !prompt}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
              }`}
            >
              {loading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> 处理中...</div> : (
                <>
                  {selectedProvider?.type === ModelType.TEXT ? <Send size={18}/> : 
                   selectedProvider?.type === ModelType.IMAGE ? <ImageIcon size={18}/> : <Video size={18}/>}
                  生成
                </>
              )}
            </button>
        </div>
      </div>

      {/* Preview / Output */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
         {/* Background pattern */}
         <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
             backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)',
             backgroundSize: '24px 24px'
         }}></div>

         {!resultUrl && selectedProvider?.type !== ModelType.TEXT && (
           <div className="text-center text-slate-500 flex flex-col items-center animate-pulse">
             <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
               {selectedProvider?.type === ModelType.VIDEO ? <Video className="w-8 h-8 opacity-50" /> : <ImageIcon className="w-8 h-8 opacity-50" />}
             </div>
             <p className="font-medium">输出预览将显示在这里</p>
             <p className="text-xs mt-2 opacity-50">请在左侧输入提示词并点击生成</p>
           </div>
         )}

         {/* Image Result */}
         {selectedProvider?.type === ModelType.IMAGE && resultUrl && (
           <div className="relative group w-full h-full flex items-center justify-center animate-in zoom-in duration-300">
             <img src={resultUrl} alt="Generated" className="max-h-full max-w-full rounded-lg shadow-2xl object-contain border border-slate-700/50" />
             <div className="absolute bottom-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                <button 
                  onClick={handleSaveToADrive}
                  disabled={uploadStatus !== 'idle'}
                  className="bg-white/90 backdrop-blur text-slate-900 px-5 py-2.5 rounded-full font-bold shadow-xl hover:bg-white transition-all flex items-center gap-2"
                >
                  {uploadStatus === 'idle' ? <CloudUpload size={18} /> : uploadStatus === 'uploading' ? <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"/> : <div className="text-green-600">✓</div>}
                  {uploadStatus === 'idle' ? '保存到阿里云盘' : uploadStatus === 'uploading' ? '上传中...' : '已保存'}
                </button>
             </div>
           </div>
         )}

         {/* Video Result */}
         {selectedProvider?.type === ModelType.VIDEO && resultUrl && (
            <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in duration-300">
              <video src={resultUrl} controls className="max-h-full max-w-full rounded-lg shadow-2xl border border-slate-700/50" />
              <div className="absolute bottom-6 flex gap-3">
                <button 
                  onClick={handleSaveToADrive}
                  disabled={uploadStatus !== 'idle'}
                  className="bg-white/90 backdrop-blur text-slate-900 px-5 py-2.5 rounded-full font-bold shadow-xl hover:bg-white transition-all flex items-center gap-2"
                >
                  <CloudUpload size={18} />
                  {uploadStatus === 'idle' ? '保存到阿里云盘' : uploadStatus === 'uploading' ? '上传中...' : '已保存'}
                </button>
             </div>
            </div>
         )}
         
         {/* Text Result Placeholder for Right Panel */}
         {selectedProvider?.type === ModelType.TEXT && (
             <div className="text-slate-500 flex flex-col items-center justify-center h-full opacity-60">
                <div className="w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="w-10 h-10 text-blue-400"/>
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-2">对话模式</h3>
                <p className="max-w-xs text-center text-sm">所有交互均在左侧面板进行。历史记录将保留在此会话中。</p>
             </div>
         )}
      </div>
    </div>
  );
};