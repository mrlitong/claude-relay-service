/**
 * 主聊天界面组件 - 核心UI组件
 * 这就是你的Claude聊天界面的心脏！
 */

import React, { useEffect, useRef, useState } from 'react';
import { Send, Plus, Loader2, AlertCircle, Cpu, ChevronDown } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ConversationList from './ConversationList';
import SettingsModal from './SettingsModal';
import ClaudeIcon from './ClaudeIcon';
import useChatStore from '../stores/chatStore';
import claudeApi, { AVAILABLE_MODELS, ModelId } from '../services/claudeApi';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [currentModel, setCurrentModel] = useState<ModelId>('claude-sonnet-4-20250514');
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    getCurrentConversation,
    sendMessage,
    isLoading,
    streamingMessageId,
    error,
    clearError,
    createNewConversation,
    currentConversationId,
  } = useChatStore();
  
  const currentConversation = getCurrentConversation();
  
  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);
  
  // 初始化模型设置
  useEffect(() => {
    const savedModel = (localStorage.getItem('claude_model') as ModelId) || 'claude-sonnet-4-20250514';
    setCurrentModel(savedModel);
    claudeApi.setModel(savedModel);
  }, []);
  
  // 切换暗黑模式
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);
  
  // 自动调整textarea高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    
    await sendMessage(message);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleNewChat = () => {
    createNewConversation();
  };
  
  const handleModelChange = (modelId: ModelId) => {
    setCurrentModel(modelId);
    claudeApi.setModel(modelId);
    localStorage.setItem('claude_model', modelId);
    setShowModelDropdown(false);
  };
  
  return (
    <div className="flex h-screen bg-primary">
      {/* Sidebar - 会话列表 */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <div className="h-full bg-secondary border-r border-primary">
          <ConversationList 
            onOpenSettings={() => setShowSettings(true)} 
            onToggleSidebar={() => setShowSidebar(false)}
          />
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-secondary/80 backdrop-blur-lg border-b border-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2.5 rounded-xl bg-tertiary/50 hover:bg-tertiary text-secondary hover:text-primary transition-all duration-200 hover-lift"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h1 className="text-xl font-semibold text-primary">
              {currentConversation?.title || 'Claude Chat'}
            </h1>
            
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-tertiary text-secondary rounded-xl hover:bg-hover transition-all duration-200 hover-lift"
              >
                <Cpu className="w-4 h-4" />
                <span>{AVAILABLE_MODELS.find(m => m.id === currentModel)?.name || 'Claude Sonnet 4'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {/* Model Dropdown */}
              {showModelDropdown && (
                <div className="absolute top-full mt-2 right-0 z-50 card min-w-56 overflow-hidden">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelChange(model.id)}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-hover transition-all duration-200 ${
                        currentModel === model.id ? 'bg-tertiary text-primary font-medium' : 'text-secondary'
                      }`}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-tertiary mt-1">
                        {model.description}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Click outside to close dropdown */}
              {showModelDropdown && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowModelDropdown(false)}
                />
              )}
            </div>
          </div>
          
          <button
            onClick={handleNewChat}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {!currentConversationId ? (
            <div className="flex items-center justify-center h-full gradient-primary">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-accent flex items-center justify-center shadow-glow">
                  <ClaudeIcon size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-3">
                  Welcome to Claude Chat
                </h2>
                <p className="text-secondary mb-6 max-w-md mx-auto">
                  Start a conversation by typing a message below
                </p>
                <button
                  onClick={handleNewChat}
                  className="btn-primary px-8 py-3"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentConversation?.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={message.id === streamingMessageId}
                />
              ))}
              
              {/* Loading Indicator */}
              {isLoading && !streamingMessageId && (
                <div className="flex gap-4 p-6 bg-tertiary/50">
                  <div className="w-8 h-8 rounded-xl gradient-accent flex items-center justify-center shadow-sm">
                    <ClaudeIcon size={20} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-secondary" />
                    <span className="text-secondary">
                      {AVAILABLE_MODELS.find(m => m.id === currentModel)?.name || 'Claude'} is thinking...
                    </span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 p-4 rounded-xl flex items-start gap-3" style={{ backgroundColor: 'rgb(var(--color-error) / 0.1)', border: '1px solid rgb(var(--color-error) / 0.2)' }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'rgb(var(--color-error))' }} />
            <div className="flex-1">
              <p className="text-primary">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="hover:opacity-70 transition-opacity"
              style={{ color: 'rgb(var(--color-error))' }}
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Input Area */}
        <div className="bg-secondary/80 backdrop-blur-lg border-t border-primary px-6 py-5">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full px-5 py-3.5 pr-14 bg-tertiary border border-primary rounded-2xl resize-none text-primary placeholder:text-tertiary focus:outline-none focus:border-hover transition-all duration-200 max-h-48 scrollbar-thin"
              rows={2}
              disabled={isLoading}
            />
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 gradient-accent text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover-lift shadow-sm hover:shadow-glow"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          
          <div className="mt-2 text-xs text-tertiary text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
      
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
};

export default ChatInterface;