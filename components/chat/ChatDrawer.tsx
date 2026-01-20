'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Minus, Filter, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage, TypingIndicator, type Message } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { QuickActions } from './QuickActions';
import { useOptionalFilterContext } from '@/contexts/FilterContext';
import type { FilterState } from '@/lib/chatResponses';

export function ChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const filterContext = useOptionalFilterContext();

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  const handleApplyFilter = (filterState: FilterState) => {
    if (filterContext) {
      filterContext.applyFilters(filterState);
    }
  };

  const handleResetFilters = () => {
    if (filterContext) {
      filterContext.resetFilters();
      // Add a confirmation message
      const confirmMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '✅ Filters have been reset. The view is now showing all data.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
    }
  };

  const handleSend = async (messageText: string) => {
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      // Check if response includes filter state to apply
      if (data.filterState && filterContext) {
        handleApplyFilter(data.filterState);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Sorry, I could not process your request.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    handleSend(action);
  };

  const hasActiveFilters = filterContext?.filters !== null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={cn(
          'fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105',
          isOpen && !isMinimized && 'scale-0 opacity-0'
        )}
        aria-label="Open chat"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Drawer */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 ease-out overflow-hidden',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
          isMinimized ? 'h-14' : 'h-[600px] max-h-[80vh]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              {!isMinimized && (
                <p className="text-xs text-blue-100">Ask me anything about your data</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Status Bar */}
        {!isMinimized && hasActiveFilters && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Filter className="w-4 h-4" />
              <span>Filters active</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        )}

        {/* Messages Area */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <QuickActions onSelectAction={handleQuickAction} />
              ) : (
                <>
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <ChatInput
              onSend={handleSend}
              disabled={isLoading}
              autoFocus={isOpen && !isMinimized}
            />
          </>
        )}
      </div>
    </>
  );
}
