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
    
    // 立即关闭弹窗
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="card w-full max-w-md mx-4 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary">
          <h2 className="text-xl font-bold text-primary">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-hover rounded-xl transition-all duration-200 hover-lift"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* API Configuration */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full gradient-accent"></div>
              API Configuration
            </h3>
            
            {/* Relay Service URL */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-primary mb-2">
                Relay Service URL
              </label>
              <input
                type="url"
                value={relayUrl}
                onChange={(e) => setRelayUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="w-full px-4 py-2.5 bg-tertiary border border-primary rounded-xl text-primary placeholder:text-tertiary focus:outline-none focus:border-hover transition-all duration-200"
              />
              <p className="mt-2 text-xs text-tertiary">
                URL of your Claude Relay Service instance
              </p>
            </div>
            
            {/* API Key */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-primary mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="cr_your_api_key_here"
                  className="w-full px-4 py-2.5 pr-12 bg-tertiary border border-primary rounded-xl text-primary placeholder:text-tertiary focus:outline-none focus:border-hover transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-hover rounded-lg transition-all duration-200"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4 text-secondary" />
                  ) : (
                    <Eye className="w-4 h-4 text-secondary" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-tertiary">
                Your API key from Claude Relay Service (starts with cr_)
              </p>
            </div>
            
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                <Cpu className="w-4 h-4 inline mr-2 text-secondary" />
                Claude Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelId)}
                className="w-full px-4 py-2.5 bg-tertiary border border-primary rounded-xl text-primary focus:outline-none focus:border-hover transition-all duration-200 cursor-pointer"
              >
                {AVAILABLE_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-tertiary">
                {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.description}
              </p>
            </div>
          </div>
          
          {/* Theme Settings */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              Appearance
            </h3>
            
            <div className="flex items-center justify-between p-3 bg-tertiary rounded-xl">
              <span className="text-sm font-medium text-primary">
                Dark Mode
              </span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${
                  darkMode ? 'gradient-accent shadow-glow' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                    darkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">Toggle dark mode</span>
                {darkMode ? (
                  <Moon className="absolute right-1.5 w-3.5 h-3.5 text-white" />
                ) : (
                  <Sun className="absolute left-1.5 w-3.5 h-3.5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-tertiary/30 border-t border-primary">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;