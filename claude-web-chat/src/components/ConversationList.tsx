/**
 * 会话列表组件 - 管理所有聊天会话
 */

import React from 'react';
import { MessageSquare, Trash2, Edit2, Check, X, Settings, ChevronLeft } from 'lucide-react';
import useChatStore from '../stores/chatStore';

interface ConversationListProps {
  onOpenSettings: () => void;
  onToggleSidebar?: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ onOpenSettings, onToggleSidebar }) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  
  const {
    conversations,
    currentConversationId,
    selectConversation,
    deleteConversation,
    updateConversationTitle,
  } = useChatStore();
  
  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  
  const handleEdit = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };
  
  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateConversationTitle(editingId, editTitle.trim());
      setEditingId(null);
      setEditTitle('');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <div className="h-full flex flex-col bg-secondary">
      {/* Header */}
      <div className="p-5 border-b border-primary flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">
          Chat History
        </h2>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-hover rounded-xl transition-all duration-200 hover-lift"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-5 h-5 text-secondary" />
          </button>
        )}
      </div>
      
      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {sortedConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-tertiary flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-tertiary" />
            </div>
            <p className="text-secondary">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedConversations.map((conversation) => {
              const isActive = conversation.id === currentConversationId;
              const isEditing = conversation.id === editingId;
              
              return (
                <div
                  key={conversation.id}
                  className={`group relative rounded-xl transition-all duration-200 mb-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20'
                      : 'hover:bg-hover'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 p-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="flex-1 px-3 py-1.5 border border-primary rounded-lg bg-tertiary text-primary text-sm focus:outline-none focus:border-hover"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-1.5 hover:bg-tertiary rounded-lg transition-colors"
                      >
                        <Check className="w-4 h-4" style={{ color: 'rgb(var(--color-success))' }} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-1.5 hover:bg-tertiary rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" style={{ color: 'rgb(var(--color-error))' }} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => selectConversation(conversation.id)}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isActive ? 'gradient-accent shadow-sm' : 'bg-tertiary'
                      }`}>
                        <MessageSquare className={`w-5 h-5 ${isActive ? 'text-white' : 'text-secondary'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-tertiary">
                          {formatDate(conversation.updatedAt)} · {conversation.messages.length} messages
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(conversation.id, conversation.title);
                          }}
                          className="p-1.5 hover:bg-tertiary rounded-lg transition-all duration-200"
                          title="Edit title"
                        >
                          <Edit2 className="w-4 h-4 text-tertiary hover:text-secondary" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this conversation?')) {
                              deleteConversation(conversation.id);
                            }
                          }}
                          className="p-1.5 hover:bg-tertiary rounded-lg transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 hover:opacity-80" style={{ color: 'rgb(var(--color-error))' }} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer with Settings */}
      <div className="border-t border-primary">
        <button
          onClick={onOpenSettings}
          className="w-full p-4 flex items-center gap-3 hover:bg-hover transition-all duration-200 text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-tertiary group-hover:bg-hover flex items-center justify-center transition-colors">
            <Settings className="w-5 h-5 text-secondary group-hover:rotate-45 transition-transform duration-300" />
          </div>
          <span className="text-sm font-medium text-primary">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default ConversationList;