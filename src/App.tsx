import React from 'react'
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>OmniModel Hub</h1>
      <p>AI 模型交互平台 - 成功加载！</p>
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={() => setCount((count) => count + 1)}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
          }}
        >
          点击计数: {count}
        </button>
      </div>
      <p>如果您能看到此页面，表示应用正常运行。</p>
    </div>
  )
}

export default App