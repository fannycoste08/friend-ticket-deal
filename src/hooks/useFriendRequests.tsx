import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useFriendRequests = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadCount = async () => {
      const { data } = await supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      setCount(data?.length || 0);
    };

    loadCount();

    // Subscribe to changes
    const channel = supabase
      .channel('friendship-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${user.id}`,
        },
        () => {
          loadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
};
