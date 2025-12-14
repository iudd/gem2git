import React, { useState } from 'react';
import { ProviderConfig } from '../types';
import { FileText, Upload, Download, Trash2, Play } from 'lucide-react';

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
    console.log('Downloading', file.name);
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">云盘批量处理</h2>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg cursor-pointer text-white">
            <Upload className="w-4 h-4" />
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            批量处理
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <div>
              <h3 className="text-lg font-semibold">正在批量处理文件...</h3>
              <p className="text-slate-400 text-sm">请稍候，处理完成后将自动更新状态</p>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-slate-400 text-sm mt-2">{progress}% 完成</p>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        {files.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">还没有上传文件</p>
            <p>点击上方按钮上传文件开始批量处理</p>
          </div>
        )}
        <div className="space-y-4">
          {files.map((file) => (
            <div key={file.id} className="bg-slate-700 p-4 rounded-lg border border-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-slate-400" />
                <div>
                  <h3 className="font-semibold text-lg">{file.name}</h3>
                  <p className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.uploadedAt.toLocaleString()}</p>
                  <p className={`text-sm ${file.status === 'processed' ? 'text-green-400' : 'text-blue-400'}`}>
                    {file.status === 'uploaded' ? '已上传' : file.status === 'processing' ? '处理中' : '已处理'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {file.status === 'processed' && (
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-2 hover:bg-green-700 rounded-md text-green-400"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteFile(file.id)}
                  className="p-2 hover:bg-red-700 rounded-md text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { BatchGenerator };</parameter