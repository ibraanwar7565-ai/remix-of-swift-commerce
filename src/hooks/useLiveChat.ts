import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function useLiveChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isConnecting, setIsConnecting] = useState(false);

  const startLiveChat = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsConnecting(true);
    try {
      // Find an admin or support user via security definer function
      const { data: targetUserId, error: fnError } = await supabase
        .rpc('find_support_user', { _exclude_user_id: user.id });

      if (fnError || !targetUserId) {
        toast.error(t('noSupportAvailable'));
        return;
      }

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_one.eq.${user.id},participant_two.eq.${targetUserId}),and(participant_one.eq.${targetUserId},participant_two.eq.${user.id})`
        )
        .maybeSingle();

      let conversationId: string;
      if (existing) {
        conversationId = existing.id;
      } else {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({ participant_one: user.id, participant_two: targetUserId })
          .select('id')
          .single();
        if (error) throw error;
        conversationId = newConv.id;
      }

      // Navigate to chat page with the conversation pre-selected
      navigate(`/chat?conv=${conversationId}`);
    } catch (err) {
      console.error('Live chat error:', err);
      toast.error(t('noSupportAvailable'));
    } finally {
      setIsConnecting(false);
    }
  };

  return { startLiveChat, isConnecting };
}
