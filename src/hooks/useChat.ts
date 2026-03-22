import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { playNotificationSound } from '@/lib/notificationSound';
import { toast } from 'sonner';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  created_at: string;
  other_user?: { full_name: string | null; avatar_url: string | null; user_id: string };
  last_message?: string;
  unread_count?: number;
}

export function useChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      // Fetch other user profiles and last messages
      const enriched = await Promise.all(
        data.map(async (conv) => {
          const otherId = conv.participant_one === user.id ? conv.participant_two : conv.participant_one;

          const { data: profileRows } = await supabase
            .rpc('get_profile_display', { _user_id: otherId });
          const profile = profileRows && profileRows.length > 0 ? profileRows[0] : null;

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('conversation_id', conv.id)
            .eq('read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            other_user: profile || { full_name: 'Unknown User', avatar_url: null, user_id: otherId },
            last_message: lastMsg?.content,
            unread_count: count || 0,
          };
        })
      );

      return enriched;
    },
    enabled: !!user,
  });

  // Fetch messages for a conversation
  const useMessages = (conversationId: string | null) => {
    return useQuery({
      queryKey: ['messages', conversationId],
      queryFn: async (): Promise<Message[]> => {
        if (!conversationId) return [];
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        return (data || []) as Message[];
      },
      enabled: !!conversationId,
    });
  };

  // Send a message
  const sendMessage = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Start or find a conversation
  const startConversation = useMutation({
    mutationFn: async (otherUserId: string): Promise<string> => {
      if (!user) throw new Error('Not authenticated');

      // Check if conversation exists (in either order)
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`
        )
        .maybeSingle();

      if (existing) return existing.id;

      const { data, error } = await supabase
        .from('conversations')
        .insert({ participant_one: user.id, participant_two: otherUserId })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('read', false);
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }, [user, queryClient]);

  // Realtime subscription
  const useRealtimeMessages = (conversationId: string | null) => {
    useEffect(() => {
      if (!conversationId || !user) return;

      const channel = supabase
        .channel(`messages-${conversationId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          (payload: any) => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });

            // Notify only if the message is from someone else
            if (payload.new?.sender_id && payload.new.sender_id !== user.id) {
              playNotificationSound('delivery');
              toast('💬 New message', {
                description: (payload.new.content as string)?.slice(0, 80) || 'You have a new message',
              });

              // Browser push notification
              if (Notification.permission === 'granted') {
                new Notification('New message on HALLOFRESH', {
                  body: (payload.new.content as string)?.slice(0, 120) || 'You have a new message',
                  icon: '/pwa-192x192.png',
                });
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
              }
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }, [conversationId, user, queryClient]);
  };

  // Fetch all users (for starting new conversations)
  const { data: allUsers } = useQuery({
    queryKey: ['all-users-for-chat', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .neq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get roles for users
  const useUserRoles = (userId: string) => {
    return useQuery({
      queryKey: ['user-role-label', userId],
      queryFn: async () => {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
        return data?.map(r => r.role) || ['customer'];
      },
    });
  };

  return {
    conversations: conversations || [],
    conversationsLoading,
    useMessages,
    sendMessage,
    startConversation,
    markAsRead,
    useRealtimeMessages,
    allUsers: allUsers || [],
    useUserRoles,
  };
}
