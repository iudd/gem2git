import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">全能模型中心</h1>
      <div className="space-y-4">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">服务商管理</h2>
          <p>这里是服务商管理功能</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">AI 演练场</h2>
          <p>这里是AI对话功能</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">云盘批量处理</h2>
          <p>这里是文件处理功能</p>
        </div>
      </div>
    </div>
  );
};

export default App;</parameter