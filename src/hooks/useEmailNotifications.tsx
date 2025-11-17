import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STORAGE_KEY = 'email_notifications_enabled';

export const useEmailNotifications = (userId: string | undefined) => {
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const toggleEmailNotifications = async (enabled: boolean) => {
    if (!userId) return;

    try {
      // Update all user's wanted tickets
      const { error } = await supabase
        .from('wanted_tickets')
        .update({ email_notifications: enabled })
        .eq('user_id', userId);

      if (error) throw error;

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, enabled.toString());
      setEmailNotificationsEnabled(enabled);

      toast.success(
        enabled 
          ? 'Notificaciones por email activadas' 
          : 'Notificaciones por email desactivadas'
      );
    } catch (error) {
      console.error('Error updating email notifications:', error);
      toast.error('Error al actualizar las notificaciones');
    }
  };

  // Sync localStorage with database on mount
  useEffect(() => {
    const syncNotifications = async () => {
      if (!userId) return;

      const stored = localStorage.getItem(STORAGE_KEY);
      const enabled = stored === null ? true : stored === 'true';

      // Update all wanted tickets to match localStorage
      await supabase
        .from('wanted_tickets')
        .update({ email_notifications: enabled })
        .eq('user_id', userId);
    };

    syncNotifications();
  }, [userId]);

  return {
    emailNotificationsEnabled,
    toggleEmailNotifications,
  };
};
