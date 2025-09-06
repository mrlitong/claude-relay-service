/**
 * Chat Store - 使用Zustand管理聊天状态
 * 这是应用的大脑！管理所有聊天相关的状态
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import claudeApi, { Message } from '../services/claudeApi';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  // 当前会话
  currentConversationId: string | null;
  conversations: Conversation[];
  
  // 聊天状态
  isLoading: boolean;
  streamingMessageId: string | null;
  streamingContent: string;
  error: string | null;
  
  // Actions
  createNewConversation: () => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
  
  // 获取当前会话
  getCurrentConversation: () => Conversation | undefined;
  updateConversationTitle: (id: string, title: string) => void;
}

const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentConversationId: null,
      conversations: [],
      
      isLoading: false,
      streamingMessageId: null,
      streamingContent: '',
      error: null,
      
      createNewConversation: () => {
        const id = nanoid();
        const newConversation: Conversation = {
          id,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set(state => ({
          conversations: [...state.conversations, newConversation],
          currentConversationId: id,
          error: null,
        }));
        
        return id;
      },
      
      selectConversation: (id: string) => {
        set({ currentConversationId: id, error: null });
      },
      
      deleteConversation: (id: string) => {
        set(state => {
          const newConversations = state.conversations.filter(c => c.id !== id);
          const newCurrentId = state.currentConversationId === id 
            ? (newConversations[0]?.id || null)
            : state.currentConversationId;
          
          return {
            conversations: newConversations,
            currentConversationId: newCurrentId,
          };
        });
      },
      
      getCurrentConversation: () => {
        const state = get();
        return state.conversations.find(c => c.id === state.currentConversationId);
      },
      
      updateConversationTitle: (id: string, title: string) => {
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
          ),
        }));
      },
      
      sendMessage: async (content: string) => {
        const state = get();
        
        // 确保有当前会话
        let conversationId = state.currentConversationId;
        if (!conversationId) {
          conversationId = get().createNewConversation();
        }
        
        // 添加用户消息
        const userMessage: Message = {
          id: nanoid(),
          role: 'user',
          content,
          timestamp: Date.now(),
        };
        
        set(state => ({
          conversations: state.conversations.map(c =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, userMessage],
                  updatedAt: Date.now(),
                }
              : c
          ),
          isLoading: true,
          error: null,
        }));
        
        // 如果是第一条消息，自动生成标题
        const conversation = get().getCurrentConversation();
        if (conversation && conversation.messages.length === 1) {
          const title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
          get().updateConversationTitle(conversationId, title);
        }
        
        try {
          // 创建助手消息
          const assistantMessageId = nanoid();
          const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          };
          
          // 添加空的助手消息
          set(state => ({
            conversations: state.conversations.map(c =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: [...c.messages, assistantMessage],
                    updatedAt: Date.now(),
                  }
                : c
            ),
            streamingMessageId: assistantMessageId,
            streamingContent: '',
          }));
          
          // 获取所有消息历史
          const currentConv = get().getCurrentConversation();
          // 排除刚添加的空助手消息，并过滤掉任何空内容的消息
          const messages = (currentConv?.messages.slice(0, -1) || []).filter(
            msg => msg.content && msg.content.trim() !== ''
          );
          
          // 流式接收响应
          let fullContent = '';
          console.log('[ChatStore] Starting to receive stream...');
          
          for await (const chunk of claudeApi.sendMessageStream(messages)) {
            fullContent += chunk;
            console.log('[ChatStore] Received chunk, total content length:', fullContent.length);
            
            // 更新流式内容
            set(state => ({
              streamingContent: fullContent,
              conversations: state.conversations.map(c =>
                c.id === conversationId
                  ? {
                      ...c,
                      messages: c.messages.map(m =>
                        m.id === assistantMessageId
                          ? { ...m, content: fullContent }
                          : m
                      ),
                      updatedAt: Date.now(),
                    }
                  : c
              ),
            }));
          }
          
          set({
            isLoading: false,
            streamingMessageId: null,
            streamingContent: '',
          });
          
        } catch (error) {
          console.error('Failed to send message:', error);
          
          // 删除失败的空助手消息
          const assistantMessageId = get().streamingMessageId;
          if (assistantMessageId) {
            set(state => ({
              conversations: state.conversations.map(c =>
                c.id === conversationId
                  ? {
                      ...c,
                      messages: c.messages.filter(m => m.id !== assistantMessageId),
                      updatedAt: Date.now(),
                    }
                  : c
              ),
            }));
          }
          
          set({
            isLoading: false,
            streamingMessageId: null,
            streamingContent: '',
            error: error instanceof Error ? error.message : 'Failed to send message',
          });
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'claude-chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);

export default useChatStore;