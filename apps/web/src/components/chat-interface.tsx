import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Loader2, Send, MessageCircle, Bot, User, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import AUTH_CONFIG from '@/config/auth';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
}

interface ChatInterfaceProps {
  workspaceId: string;
  fileId?: string;
  fileName?: string;
}

export function ChatInterface({ workspaceId, fileId, fileName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSources, setShowSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const token = getAuthToken();
    if (!token) {
      toast.error('Please log in to use the chat');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const endpoint = fileId 
        ? `${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}/chat`
        : `${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/chat`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          fileId,
          conversationHistory: messages.slice(-8) // Send last 8 messages for better context
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          sources: data.sources || []
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        toast.error(data.message || 'Failed to send message');
        
        // Add error message to chat
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your message. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered a connection error. Please check your internet connection and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleSources = (messageId: string) => {
    setShowSources(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;
      
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <span className="text-blue-500 font-bold mt-1">•</span>
            <span>{line.replace(/^[•-]\s*/, '')}</span>
          </div>
        );
      }
      
      // Handle numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={index} className="mb-2">
            <span className="font-medium">{line}</span>
          </div>
        );
      }
      
      return <div key={index} className="mb-2">{line}</div>;
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">AI Study Assistant</h3>
          <p className="text-sm text-gray-600">
            {fileName ? `Ask questions about "${fileName}"` : 'Ask questions about your documents'}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Sparkles className="w-3 h-3" />
          <span>Powered by Gemini</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Ask me anything</h4>
            <p className="text-sm text-gray-600 mb-4">
              Quick, direct answers about {fileName ? `"${fileName}"` : 'your documents'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage("What is the name of the book?")}
                className="text-xs"
              >
                Book name
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage("Who is the author?")}
                className="text-xs"
              >
                Author
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInputMessage("What are the main concepts?")}
                className="text-xs"
              >
                Main concepts
              </Button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
              <Card className={`${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <CardContent className="p-3">
                  <div className={`text-sm ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                    {message.role === 'user' ? (
                      message.content
                    ) : (
                      formatMessageContent(message.content)
                    )}
                  </div>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSources(message.id)}
                        className="text-xs text-gray-600 hover:text-gray-800 p-0 h-auto"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {showSources[message.id] ? 'Hide' : 'Show'} sources ({message.sources.length})
                      </Button>
                      
                      {showSources[message.id] && (
                        <div className="mt-2 space-y-2">
                          {message.sources.slice(0, 3).map((source, index) => (
                            <div key={index} className="p-2 bg-white rounded border border-gray-200">
                              <div className="text-xs text-gray-600 mb-1">
                                Source {index + 1} • Relevance: {Math.round((source.score || 0) * 100)}%
                              </div>
                              <div className="text-xs text-gray-800 line-clamp-3">
                                {source.content.substring(0, 200)}...
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className={`text-xs text-gray-500 mt-1 ${
                message.role === 'user' ? 'text-right' : 'text-left'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="animate-pulse">Searching...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your document..."
            className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
