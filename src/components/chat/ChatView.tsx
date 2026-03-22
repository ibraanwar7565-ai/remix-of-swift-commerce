import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Plus, Search, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive',
  rider: 'bg-amber-100 text-amber-700',
  customer: 'bg-primary/10 text-primary',
  order_manager: 'bg-blue-100 text-blue-700',
  inventory_manager: 'bg-emerald-100 text-emerald-700',
  support: 'bg-purple-100 text-purple-700',
};

// New Conversation Sheet
function NewConversationSheet({ onSelect }: { onSelect: (userId: string) => void }) {
  const { allUsers } = useChat();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const filtered = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="rounded-full">
          <Plus className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{t('newConversation')}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchUsers')}
              className="pl-10 rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ScrollArea className="h-[55vh]">
            <div className="space-y-1">
              {filtered.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => onSelect(u.user_id)}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(u.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{u.full_name || 'Unknown'}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-8">{t('noUsersFound')}</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Conversation List
function ConversationList({ onSelect, activeId }: { onSelect: (id: string) => void; activeId: string | null }) {
  const { conversations, conversationsLoading, startConversation } = useChat();
  const { t } = useLanguage();

  const handleNewConversation = async (userId: string) => {
    const convId = await startConversation.mutateAsync(userId);
    onSelect(convId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-bold">{t('messages')}</h1>
        <NewConversationSheet onSelect={handleNewConversation} />
      </div>

      <ScrollArea className="flex-1">
        {conversationsLoading ? (
          <div className="space-y-3 px-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-medium">{t('noConversations')}</p>
            <p className="text-sm">{t('startNewChat')}</p>
          </div>
        ) : (
          <div className="px-2">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`flex items-center gap-3 w-full p-3 rounded-2xl transition-colors mb-1 ${
                  activeId === conv.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                }`}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.other_user?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(conv.other_user?.full_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  {(conv.unread_count || 0) > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {conv.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-foreground truncate">
                    {conv.other_user?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.last_message || t('noMessagesYet')}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                </span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Chat Window
function ChatWindow({ conversationId, otherUserName, onBack }: { conversationId: string; otherUserName: string; onBack: () => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { useMessages, sendMessage, markAsRead, useRealtimeMessages } = useChat();
  const { data: messages, isLoading } = useMessages(conversationId);
  const [newMsg, setNewMsg] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useRealtimeMessages(conversationId);

  useEffect(() => {
    if (conversationId) markAsRead(conversationId);
  }, [conversationId, messages?.length, markAsRead]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMsg.trim()) return;
    sendMessage.mutate({ conversationId, content: newMsg.trim() });
    setNewMsg('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(otherUserName)}
          </AvatarFallback>
        </Avatar>
        <h2 className="font-semibold">{otherUserName}</h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-48 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {messages?.map(msg => {
              const isMine = msg.sender_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/50 bg-card">
        <div className="flex gap-2">
          <Input
            placeholder={t('typeMessage')}
            className="rounded-full bg-muted border-0"
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <Button
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
            onClick={handleSend}
            disabled={!newMsg.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Chat View (exported)
export function ChatView({ className }: { className?: string }) {
  const [searchParams] = useSearchParams();
  const preselectedConvId = searchParams.get('conv');
  const [activeConvId, setActiveConvId] = useState<string | null>(preselectedConvId);
  const { conversations } = useChat();

  // Auto-select conversation from URL param
  useEffect(() => {
    if (preselectedConvId) {
      setActiveConvId(preselectedConvId);
    }
  }, [preselectedConvId]);

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherName = activeConv?.other_user?.full_name || 'Unknown';

  return (
    <div className={`h-full ${className || ''}`}>
      {activeConvId ? (
        <ChatWindow
          conversationId={activeConvId}
          otherUserName={otherName}
          onBack={() => setActiveConvId(null)}
        />
      ) : (
        <ConversationList onSelect={setActiveConvId} activeId={activeConvId} />
      )}
    </div>
  );
}
