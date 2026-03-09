import { supabase } from '@/lib/supabase';
import { ChatMessage } from '@/types/database.types';

export const chatService = {
  async sendMessage(
    senderId: string,
    receiverId: string,
    message: string,
    attachmentUrl?: string
  ): Promise<ChatMessage> {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message,
        attachment_url: attachmentUrl,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('notifications').insert({
      user_id: receiverId,
      title: 'New Message',
      message: 'You have a new message',
      type: 'chat',
      data: { message_id: data.id, sender_id: senderId },
    });

    return data;
  },

  async getConversation(userId: string, otherUserId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
      )
      .order('sent_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async markAsRead(messageId: string): Promise<void> {
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('id', messageId);
  },

  subscribeToMessages(
    userId: string,
    callback: (message: ChatMessage) => void
  ) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();
  },
};
