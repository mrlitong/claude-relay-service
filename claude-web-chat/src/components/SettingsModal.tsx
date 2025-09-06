/**
 * 设置模态框组件 - 配置API Key和其他设置
 */

import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Save, Eye, EyeOff, Cpu } from 'lucide-react';
import claudeApi, { AVAILABLE_MODELS, ModelId } from '../services/claudeApi';

interface SettingsModalProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ darkMode, setDarkMode, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [relayUrl, setRelayUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelId>('claude-sonnet-4-20250514');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  
  useEffect(() => {
    // 从localStorage加载设置
    const savedApiKey = localStorage.getItem('claude_api_key') || '';
    const savedRelayUrl = localStorage.getItem('relay_service_url') || '';
    const savedModel = (localStorage.getItem('claude_model') as ModelId) || 'claude-sonnet-4-20250514';
    
    setApiKey(savedApiKey);
    setRelayUrl(savedRelayUrl);
    setSelectedModel(savedModel);
  }, []);
  
  const handleSave = () => {
    // 保存到localStorage
    localStorage.setItem('claude_api_key', apiKey);
    localStorage.setItem('relay_service_url', relayUrl);
    localStorage.setItem('claude_model', selectedModel);
    
    // 更新API服务配置
    claudeApi.setApiKey(apiKey);
    claudeApi.setBaseURL(relayUrl); // 空字符串使用相对路径
    claudeApi.setModel(selectedModel);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* API Configuration */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              API Configuration
            </h3>
            
            {/* Relay Service URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Relay Service URL
              </label>
              <input
                type="url"
                value={relayUrl}
                onChange={(e) => setRelayUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                URL of your Claude Relay Service instance
              </p>
            </div>
            
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="cr_your_api_key_here"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your API key from Claude Relay Service (starts with cr_)
              </p>
            </div>
            
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Cpu className="w-4 h-4 inline mr-1" />
                Claude Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelId)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {AVAILABLE_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.description}
              </p>
            </div>
          </div>
          
          {/* Theme Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Appearance
            </h3>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Dark Mode
              </span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">Toggle dark mode</span>
                {darkMode ? (
                  <Moon className="absolute right-1 w-3 h-3 text-white" />
                ) : (
                  <Sun className="absolute left-1 w-3 h-3 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;