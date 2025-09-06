/**
 * 聊天消息组件 - 显示单条消息
 * 支持Markdown渲染和代码高亮！
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { User, Copy, Check } from 'lucide-react';
import { Message } from '../services/claudeApi';
import claudeApi, { AVAILABLE_MODELS } from '../services/claudeApi';
import ClaudeIcon from './ClaudeIcon';
// import 'highlight.js/styles/github-dark.css';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming }) => {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const isUser = message.role === 'user';
  const currentModel = claudeApi.getCurrentModel();
  const modelName = AVAILABLE_MODELS.find(m => m.id === currentModel)?.name || 'Claude';
  
  return (
    <div className={`flex gap-4 p-6 ${isUser ? 'bg-secondary/50' : 'bg-tertiary/30'} hover:bg-hover/50 transition-colors duration-200`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
          isUser ? 'gradient-accent' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
        }`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <ClaudeIcon size={20} className="text-white" />
          )}
        </div>
      </div>
      
      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <span className="font-semibold text-primary">
            {isUser ? 'You' : modelName}
          </span>
          
          {!isUser && !isStreaming && (
            <button
              onClick={handleCopy}
              className="ml-2 p-1.5 rounded-lg hover:bg-tertiary transition-all duration-200"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-4 h-4" style={{ color: 'rgb(var(--color-success))' }} />
              ) : (
                <Copy className="w-4 h-4 text-tertiary hover:text-secondary" />
              )}
            </button>
          )}
        </div>
        
        {/* Markdown Content */}
        <div className="prose prose-sm max-w-none">
          {isUser ? (
            <p className="text-primary whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // 自定义代码块样式
                pre: ({ children, ...props }) => (
                  <pre className="p-4 rounded-xl overflow-x-auto my-4" style={{ background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)' }} {...props}>
                    {children}
                  </pre>
                ),
                code: ({ inline, children, ...props }: any) => (
                  inline ? (
                    <code className="px-1.5 py-0.5 rounded-md text-sm font-mono" style={{ backgroundColor: 'rgb(var(--color-accent) / 0.1)', color: 'rgb(var(--color-accent))' }} {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="text-gray-100" {...props}>{children}</code>
                  )
                ),
                // 自定义链接
                a: ({ children, ...props }) => (
                  <a className="hover:underline underline-offset-2" style={{ color: 'rgb(var(--color-accent))' }} target="_blank" rel="noopener noreferrer" {...props}>
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          
          {/* 流式响应指示器 */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 animate-pulse-smooth rounded-full" style={{ backgroundColor: 'rgb(var(--color-accent))' }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;