import React, { useState, useRef, useEffect } from 'react';
import { ProviderConfig } from '../types';
import { Send, Bot, User, Sparkles, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PlaygroundProps {
  providers: ProviderConfig[];
}

const Playground: React.FC<PlaygroundProps> = ({ providers }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const enabledProviders = providers.filter(p => p.enabled);

  useEffect(() => {
    if (enabledProviders.length > 0 && !selectedProvider) {
      setSelectedProvider(enabledProviders[0].id);
    }
  }, [providers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedProvider) return;

    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 模拟API调用
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `来自 ${provider.name} 的回复：\n\n${userMessage.content}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AI 演练场</h2>
              <p className="text-slate-400 text-sm">与AI模型实时对话</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 transition-all duration-200 min-w-[200px]"
            >
              {selectedProviderData ? (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                    {selectedProviderData.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{selectedProviderData.name}</p>
                    <p className="text-xs text-slate-400">{selectedProviderData.type.toUpperCase()}</p>
                  </div>
                </>
              ) : (
                <span className="text-slate-400">选择服务商</span>
              )}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 w-full bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl shadow-slate-900/50 z-10">
                {enabledProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                      {provider.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{provider.name}</p>
                      <p className="text-xs text-slate-400">{provider.type.toUpperCase()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Bot className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">开始您的AI对话</h3>
            <p className="text-slate-500 max-w-md mx-auto">选择一个服务商，然后输入您的消息开始与AI对话</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}
          >
            <div
              className={`max-w-xs lg:max-w-md xl:max-w-lg px-6 py-4 rounded-2xl flex items-start gap-3 shadow-lg ${message.role === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-blue-500/25'
                : 'bg-gradient-to-r from-slate-700 to-slate-800 text-slate-100 border border-slate-600/50 shadow-slate-900/50'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/25">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 opacity-70 ${message.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-slate-100 px-6 py-4 rounded-2xl border border-slate-600/50 shadow-lg shadow-slate-900/50 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/25">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                <span className="text-sm">AI 正在思考...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的消息... (Enter 发送，Shift+Enter 换行)"
              rows={1}
              className="w-full px-6 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 resize-none min-h-[52px] max-h-32 overflow-y-auto"
              style={{ height: 'auto', minHeight: '52px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !selectedProvider}
            className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center gap-2 text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">发送</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export { Playground };