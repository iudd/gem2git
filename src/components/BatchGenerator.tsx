import React, { useState } from 'react';
import { ProviderConfig } from '../types';
import { FileText, Upload, Download, Trash2, Play, CheckCircle, AlertCircle } from 'lucide-react';

interface BatchGeneratorProps {
  providers: ProviderConfig[];
}

const BatchGenerator: React.FC<BatchGeneratorProps> = ({ providers }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 模拟文件处理
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploaded',
        uploadedAt: new Date()
      };
      setFiles(prev => [...prev, newFile]);
    }
  };

  const processBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    // 模拟进度
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setFiles(prev => prev.map(f => ({ ...f, status: 'processed' })));
          setIsProcessing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const downloadFile = (file: any) => {
    // 模拟下载
    console.log('Downloading', file.name);
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'processing': return <Play className="w-5 h-5 text-blue-400" />;
      case 'processed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded': return '已上传';
      case 'processing': return '处理中';
      case 'processed': return '已处理';
      default: return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'processing': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'processed': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">云盘批量处理</h2>
          <p className="text-slate-400 mt-1">上传文件并批量处理AI任务</p>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 rounded-xl cursor-pointer text-white font-medium shadow-lg shadow-slate-900/25 hover:shadow-slate-900/40 transition-all duration-300 hover:scale-105 border border-slate-600/50">
            <Upload className="w-5 h-5" />
            上传文件
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
          </label>
          <button
            onClick={processBatch}
            disabled={files.length === 0 || isProcessing}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
          >
            <Play className="w-5 h-5 inline mr-2" />
            批量处理
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 backdrop-blur-xl p-6 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <div>
              <h3 className="text-lg font-semibold text-blue-300">正在批量处理文件...</h3>
              <p className="text-slate-400 text-sm">请稍候，处理完成后将自动更新状态</p>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-slate-400 text-sm mt-2">{progress}% 完成</p>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl shadow-slate-900/50 p-8">
        <div className="space-y-6">
          {files.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-600/50 to-slate-700/50 rounded-2xl flex items-center justify-center border border-slate-600/30 border-dashed">
                <Upload className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">还没有上传文件</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">点击上方按钮上传文件，或拖拽文件到此处开始批量处理AI任务</p>
              <div className="flex gap-4 justify-center">
                <div className="px-4 py-2 bg-slate-700/50 rounded-lg text-sm text-slate-400 border border-slate-600/30">
                  支持格式: PDF, DOCX, TXT
                </div>
                <div className="px-4 py-2 bg-slate-700/50 rounded-lg text-sm text-slate-400 border border-slate-600/30">
                  最大文件: 10MB
                </div>
              </div>
            </div>
          )}
          {files.map((file) => (
            <div key={file.id} className="group relative bg-gradient-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-600/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors duration-200">{file.name}</h3>
                    <p className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.uploadedAt.toLocaleString()}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(file.status)} border`}>
                  {getStatusIcon(file.status)}
                  <span>{getStatusText(file.status)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-slate-500 text-sm">
                  类型: {file.type}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {file.status === 'processed' && (
                    <button
                      onClick={() => downloadFile(file)}
                      className="p-3 hover:bg-green-500/20 rounded-xl transition-colors duration-200"
                    >
                      <Download className="w-5 h-5 text-green-400 hover:text-green-300" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteFile(file.id)}
                    className="p-3 hover:bg-red-500/20 rounded-xl transition-colors duration-200"
                  >
                    <Trash2 className="w-5 h-5 text-slate-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { BatchGenerator };