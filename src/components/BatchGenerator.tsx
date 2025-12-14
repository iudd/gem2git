import React, { useState } from 'react';
import { ProviderConfig } from '../types';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';

interface BatchGeneratorProps {
  providers: ProviderConfig[];
}

const BatchGenerator: React.FC<BatchGeneratorProps> = ({ providers }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 模拟文件处理
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploaded'
      };
      setFiles(prev => [...prev, newFile]);
    }
  };

  const processBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    // 模拟批量处理
    setTimeout(() => {
      setFiles(prev => prev.map(f => ({ ...f, status: 'processed' })));
      setIsProcessing(false);
    }, 2000);
  };

  const downloadFile = (file: any) => {
    // 模拟下载
    console.log('Downloading', file.name);
  };

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">云盘批量处理</h2>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer text-white">
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
          >
            批量处理
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="space-y-4">
          {files.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>还没有上传文件</p>
              <p className="text-sm">点击上方按钮上传文件开始批量处理</p>
            </div>
          )}
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${file.status === 'processed' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                  {file.status === 'processed' ? '已处理' : '待处理'}
                </span>
                {file.status === 'processed' && (
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-2 hover:bg-slate-600 rounded-md text-green-400"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteFile(file.id)}
                  className="p-2 hover:bg-red-600 rounded-md text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {isProcessing && (
          <div className="mt-4 p-4 bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            <span>正在批量处理文件...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export { BatchGenerator };