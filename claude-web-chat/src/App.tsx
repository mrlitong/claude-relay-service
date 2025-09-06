/**
 * 主应用组件 - 应用入口
 */

import React from 'react';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <div className="h-screen">
      <ChatInterface />
    </div>
  );
}

export default App;