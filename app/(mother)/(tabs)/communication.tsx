import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { chatService } from '@/services/chatService';
import { supabase } from '@/lib/supabase';
import { Send, ArrowLeft, User } from 'lucide-react-native';
import { ChatMessage } from '@/types/database.types';

interface ChatContact {
  id: string;
  name: string;
  lastMessage?: string;
  unreadCount: number;
  odUserId: string;
}

export default function CommunicationScreen() {
  const { user, motherProfile } = useAuth();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.odUserId);
    }
  }, [selectedContact]);

  const loadContacts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (motherProfile?.assigned_doctor_id) {
        const { data: doctorData } = await supabase
          .from('doctor_profiles')
          .select('*')
          .eq('user_id', motherProfile.assigned_doctor_id)
          .single();

        if (doctorData) {
          setContacts([{
            id: doctorData.id,
            name: `Dr. ${doctorData.first_name || ''} ${doctorData.last_name || ''}`.trim() || 'Healthcare Provider',
            odUserId: doctorData.user_id,
            unreadCount: 0,
          }]);
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const msgs = await chatService.getConversation(user.id, otherUserId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !user) return;
    setSending(true);
    try {
      const message = await chatService.sendMessage(
        user.id,
        selectedContact.odUserId,
        newMessage.trim()
      );
      if (message) {
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        flatListRef.current?.scrollToEnd();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderContact = ({ item }: { item: ChatContact }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => setSelectedContact(item)}
    >
      <View style={styles.avatar}>
        <User size={24} color="#007AFF" />
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.lastMsg} numberOfLines={1}>
          {item.lastMessage || 'Start a conversation'}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.sender_id === user?.id;
    return (
      <View style={[styles.msgContainer, isMyMessage ? styles.myMsg : styles.theirMsg]}>
        <Text style={[styles.msgText, isMyMessage ? styles.myMsgText : styles.theirMsgText]}>
          {item.message}
        </Text>
        <Text style={[styles.msgTime, isMyMessage ? styles.myMsgTime : styles.theirMsgTime]}>
          {new Date(item.sent_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (selectedContact) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedContact(null)} style={styles.backBtn}>
            <ArrowLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.chatTitle}>{selectedContact.name}</Text>
        </View>
        {loading ? (
          <View style={styles.loadingView}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.msgList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
              onPress={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Chat with your healthcare provider</Text>
      </View>
      {loading ? (
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.empty}>
          <User size={48} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>No Conversations</Text>
          <Text style={styles.emptyText}>Your healthcare provider will appear here once assigned</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1E' },
  subtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backBtn: { marginRight: 12 },
  chatTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  loadingView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16 },
  chatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  lastMsg: { fontSize: 14, color: '#8E8E93' },
  badge: { backgroundColor: '#007AFF', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, minWidth: 24, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginTop: 8 },
  msgList: { padding: 16 },
  msgContainer: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  myMsg: { backgroundColor: '#007AFF', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirMsg: { backgroundColor: '#E5E5EA', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 16 },
  myMsgText: { color: '#fff' },
  theirMsgText: { color: '#1C1C1E' },
  msgTime: { fontSize: 11, marginTop: 4 },
  myMsgTime: { color: 'rgba(255, 255, 255, 0.7)', textAlign: 'right' },
  theirMsgTime: { color: '#8E8E93' },
  inputBox: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  input: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, maxHeight: 100, marginRight: 8 },
  sendBtn: { backgroundColor: '#007AFF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#C7C7CC' },
});

