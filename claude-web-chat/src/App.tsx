/**
 * 主应用组件 - 应用入口
 */

import React from 'react';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';
import { Settings } from 'lucide-react';

function App() {
  const [showSettings, setShowSettings] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  // 切换暗黑模式
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);
  
  return (
    <div className="relative h-screen">
      {/* Main Chat Interface */}
      <ChatInterface />
      
      {/* Settings Button - 移到左下角 */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-6 left-6 p-3 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors z-50"
        title="Settings"
      >
        <Settings className="w-6 h-6" />
      </button>
      
      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;