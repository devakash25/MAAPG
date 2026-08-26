import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerApi } from '@/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeStore } from '@/store/themeStore';
import { cn, timeAgo, getInitials, truncate } from '@/utils/helpers';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/authStore';
import {
  Send,
  MessageCircle,
  ArrowLeft,
  Search,
} from 'lucide-react';

export default function BuyerMessagesPage() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileList, setIsMobileList] = useState(true);

  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['buyerConversations'],
    queryFn: () => buyerApi.getConversations().then((res) => res.data),
  });

  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['buyerConversation', selectedConversation],
    queryFn: () => buyerApi.getConversation(selectedConversation!).then((res) => res.data),
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { receiverId: string; content: string }) =>
      buyerApi.sendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyerConversations'] });
      queryClient.invalidateQueries({ queryKey: ['buyerConversation', selectedConversation] });
      setNewMessage('');
    },
    onError: () => addToast('Failed to send message', 'error'),
  });

  const conversations = conversationsData?.data || [];
  const messages = messagesData?.data || [];

  const filteredConversations = conversations.filter((c: any) => {
    if (!searchQuery) return true;
    const otherUser = c.participants?.find((p: any) => p.id !== user?.id);
    const name = `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const activeConversation = conversations.find((c: any) => c.id === selectedConversation);
  const otherParticipant = activeConversation?.participants?.find(
    (p: any) => p.id !== user?.id
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !otherParticipant?.id) return;
    sendMessageMutation.mutate({
      receiverId: otherParticipant.id,
      content: newMessage.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    setIsMobileList(false);
  };

  const handleBackToList = () => {
    setIsMobileList(true);
    setSelectedConversation(null);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-[#0f172a] dark:text-white">
          Messages
        </h1>
        <p className="text-gray-500 text-sm">Chat with property owners</p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex h-[calc(100vh-220px)]">
        {/* Left Panel - Conversations */}
        <div
          className={cn(
            'w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col',
            'flex-shrink-0',
            !isMobileList && selectedConversation ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20',
                  theme === 'dark'
                    ? 'bg-[#1e293b] border-gray-700 text-white placeholder-gray-500'
                    : 'bg-gray-50 border-gray-200'
                )}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="space-y-2 p-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 py-8">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <MessageCircle size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  No conversations yet
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Start a conversation by enquiring about a property
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation: any) => {
                const other = conversation.participants?.find(
                  (p: any) => p.id !== user?.id
                );
                const lastMessage = conversation.lastMessage;
                const isActive = selectedConversation === conversation.id;
                const hasUnread = conversation.unreadCount > 0;

                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left transition-colors border-b border-gray-100 dark:border-gray-800',
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    )}
                  >
                    <div className="relative w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {getInitials(other?.firstName || '', other?.lastName || '')}
                      </span>
                      {hasUnread && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            'text-sm truncate',
                            hasUnread
                              ? 'font-semibold text-[#0f172a] dark:text-white'
                              : 'font-medium text-gray-700 dark:text-gray-300'
                          )}
                        >
                          {other?.firstName} {other?.lastName}
                        </p>
                        {lastMessage && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {timeAgo(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p
                          className={cn(
                            'text-xs truncate mt-0.5',
                            hasUnread
                              ? 'text-gray-700 dark:text-gray-300 font-medium'
                              : 'text-gray-500'
                          )}
                        >
                          {lastMessage.senderId === user?.id && 'You: '}
                          {truncate(lastMessage.content, 40)}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0',
            isMobileList && selectedConversation ? 'hidden md:flex' : '',
            !selectedConversation && 'hidden md:flex'
          )}
        >
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Select a conversation
                </h3>
                <p className="text-sm text-gray-500">
                  Choose a conversation to start chatting
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <button
                  onClick={handleBackToList}
                  className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {getInitials(
                      otherParticipant?.firstName || '',
                      otherParticipant?.lastName || ''
                    )}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0f172a] dark:text-white">
                    {otherParticipant?.firstName} {otherParticipant?.lastName}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
                {loadingMessages ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-10 rounded-lg animate-pulse',
                          i % 2 === 0 ? 'ml-auto mr-0 w-2/3' : 'mr-auto ml-0 w-2/3'
                        )}
                      />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((message: any) => {
                    const isOwn = message.senderId === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                            isOwn
                              ? 'bg-sky-500 text-white rounded-br-md'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <p
                            className={cn(
                              'text-[10px] mt-1',
                              isOwn ? 'text-sky-100' : 'text-gray-400'
                            )}
                          >
                            {timeAgo(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                    size="icon"
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
