/**
 * 主聊天界面组件 - 核心UI组件
 * 这就是你的Claude聊天界面的心脏！
 */

import React, { useEffect, useRef, useState } from 'react';
import { Send, Plus, Loader2, AlertCircle, Bot, Cpu, ChevronDown } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ConversationList from './ConversationList';
import useChatStore from '../stores/chatStore';
import claudeApi, { AVAILABLE_MODELS, ModelId } from '../services/claudeApi';

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [currentModel, setCurrentModel] = useState<ModelId>('claude-sonnet-4-20250514');
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
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar - 会话列表 */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 dark:border-gray-700`}>
        <ConversationList />
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {currentConversation?.title || 'Claude Chat'}
            </h1>
            
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Cpu className="w-4 h-4" />
                <span>{AVAILABLE_MODELS.find(m => m.id === currentModel)?.name || 'Claude Sonnet 4'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {/* Model Dropdown */}
              {showModelDropdown && (
                <div className="absolute top-full mt-1 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-48">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelChange(model.id)}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        currentModel === model.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {!currentConversationId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Welcome to Claude Chat
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Start a conversation by typing a message below
                </p>
                <button
                  onClick={handleNewChat}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                <div className="flex gap-4 p-6 bg-gray-50 dark:bg-gray-900">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-gray-500">Claude is thinking...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 max-h-48"
              rows={1}
              disabled={isLoading}
            />
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-3 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;