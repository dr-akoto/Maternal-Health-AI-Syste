import { supabase } from '@/lib/supabase';

export const notificationsService = {
  async getForUser(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async markAsRead(id: string) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) throw error;
  },

  async markAllForUser(userId: string) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
    if (error) throw error;
  },
};
