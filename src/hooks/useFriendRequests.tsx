import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFriendRequests = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadCount = async () => {
      // Count pending friend requests received
      const { count: friendCount } = await supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      // Count pending invitation approvals (invitations user sent that are still pending)
      const { count: invitationCount } = await supabase
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .eq('inviter_id', user.id)
        .eq('status', 'pending');

      setCount((friendCount || 0) + (invitationCount || 0));
    };

    loadCount();

    // Subscribe to friendship changes
    const friendChannel = supabase
      .channel('friendship-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${user.id}`,
        },
        () => loadCount()
      )
      .subscribe();

    // Subscribe to invitation changes
    const invitationChannel = supabase
      .channel('invitation-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `inviter_id=eq.${user.id}`,
        },
        () => loadCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendChannel);
      supabase.removeChannel(invitationChannel);
    };
  }, [user]);

  return count;
};
