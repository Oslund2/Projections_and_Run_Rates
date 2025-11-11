import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MessageCircle, X, Send, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { chatService } from '../services/chatService';
import { summaryService } from '../services/summaryService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatWidgetProps {
  currentView?: string;
  selectedAgentId?: string;
  selectedDivision?: string | null;
  onOpenChat?: () => void;
}

export interface ChatWidgetRef {
  openWithPrompt: (prompt: string) => void;
}

export const ChatWidget = forwardRef<ChatWidgetRef, ChatWidgetProps>(({ currentView, selectedAgentId, selectedDivision, onOpenChat }: ChatWidgetProps, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [divisionName, setDivisionName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    openWithPrompt: (prompt: string) => {
      setIsOpen(true);
      setInputMessage(prompt);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }));

  useEffect(() => {
    if (isOpen && !conversationId) {
      initializeConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadContext();
    }
  }, [isOpen, currentView, selectedAgentId, selectedDivision]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContext = async () => {
    try {
      const comprehensiveContext = await chatService.getComprehensiveContext(selectedDivision);
      setContext({
        currentView,
        selectedAgentId,
        selectedDivision,
        ...comprehensiveContext
      });
      setDivisionName(comprehensiveContext.division?.name || null);
    } catch (error) {
      console.error('Error loading context:', error);
    }
  };

  const initializeConversation = async () => {
    try {
      const conversation = await chatService.createConversation('anonymous', {
        currentView,
        selectedAgentId,
        selectedDivision
      });
      setConversationId(conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const userMsg = await chatService.addMessage(conversationId, 'user', userMessage);
      setMessages(prev => [...prev, {
        id: userMsg.id,
        role: 'user',
        content: userMessage,
        created_at: userMsg.created_at
      }]);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
          context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const assistantMessage = data.message;

      const assistantMsg = await chatService.addMessage(conversationId, 'assistant', assistantMessage);
      setMessages(prev => [...prev, {
        id: assistantMsg.id,
        role: 'assistant',
        content: assistantMessage,
        created_at: assistantMsg.created_at
      }]);

      if (messages.length === 0) {
        const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
        await chatService.updateConversationTitle(conversationId, title);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    if (conversationId) {
      try {
        await chatService.deleteConversation(conversationId);
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
    setMessages([]);
    setConversationId(null);
    initializeConversation();
  };

  const getSuggestedQuestions = () => {
    if (divisionName) {
      return [
        `Which ${divisionName} agent saves the most time?`,
        `Show me ${divisionName} agents that need validation`,
        `What's the total ROI for ${divisionName} division?`,
        `Which ${divisionName} goals are at risk?`,
        `What's the average time saved per ${divisionName} agent?`,
        `How are ${divisionName} projections comparing to actual results?`,
        `Which ${divisionName} agents have the best ROI?`,
        `What's the total FTE impact for ${divisionName} division?`,
        `Compare ${divisionName} performance to projections`
      ];
    }
    return [
      "Which agent saves the most time?",
      "Show me agents that need validation",
      "What's my total ROI?",
      "Which goals are at risk?",
      "What's the average time saved per agent?",
      "How are my projections comparing to actual results?",
      "Which agents have the best ROI?",
      "What's the total FTE impact across all agents?",
      "Explain rationale for 'projected' v. 'actual'"
    ];
  };

  const suggestedQuestions = getSuggestedQuestions();

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            onOpenChat?.();
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-accent-600 to-primary-600 text-white rounded-full shadow-soft-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center z-50 group"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 sm:bottom-6 sm:right-6 sm:top-auto sm:left-auto sm:w-96 sm:h-[600px] sm:max-h-[calc(100vh-3rem)] w-full h-full bg-white sm:rounded-2xl shadow-soft-lg sm:border border-slate-200 flex flex-col z-50 animate-scale-in">
          <div className="bg-gradient-to-r from-accent-600 to-primary-600 text-white px-3 sm:px-4 py-3 sm:rounded-t-2xl flex items-center justify-between flex-shrink-0 shadow-sm">
            <div className="flex items-center space-x-2 min-w-0">
              <MessageCircle className="w-5 h-5 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">AI Analytics Assistant</h3>
                <p className="text-xs text-accent-100 truncate">
                  {divisionName ? `${divisionName} Division` : 'Ask me about your ROI data'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 overscroll-contain">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-accent-50 to-primary-50 border border-accent-200 rounded-xl p-4 shadow-soft">
                  <p className="text-sm text-slate-700 mb-3">
                    Hi! I'm your AI analytics assistant. I can help you understand your AI agent performance, ROI metrics, and provide recommendations.
                  </p>
                  <p className="text-xs text-slate-600 mb-2 font-semibold">Try asking:</p>
                  <div className="space-y-1.5">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(question)}
                        className="w-full text-left text-xs text-accent-700 bg-white border border-accent-200 rounded-lg px-2 py-1.5 hover:bg-accent-50 transition-all duration-200 hover:shadow-sm"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-accent-600 to-accent-500 text-white'
                      : 'bg-slate-50 text-slate-900 border border-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-accent-600" />
                    <p className="text-sm text-slate-600">Thinking...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 p-3 flex-shrink-0 bg-white">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your agents, ROI, goals..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm min-h-[44px] transition-all duration-200"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-accent-600 to-accent-500 text-white rounded-xl hover:from-accent-700 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px] min-h-[44px] touch-manipulation shadow-sm hover:shadow-md active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ChatWidget.displayName = 'ChatWidget';
