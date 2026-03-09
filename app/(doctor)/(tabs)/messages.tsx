import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Send,
  ChevronLeft,
  User,
  Clock,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { chatService } from '@/services/chatService';

interface Conversation {
  id: string;
  patientId: string;
  patientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: 'doctor' | 'mother';
  createdAt: string;
}

export default function MessagesScreen() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          conversation_id,
          mother:mother_profiles!inner(id, first_name, last_name)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();
      data?.forEach((msg: any) => {
        const convId = msg.conversation_id || msg.mother?.id;
        if (!convId) return;

        if (!conversationMap.has(convId)) {
          conversationMap.set(convId, {
            id: convId,
            patientId: msg.mother?.id,
            patientName: msg.mother ? `${msg.mother.first_name} ${msg.mother.last_name}` : 'Unknown',
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: 0,
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(
        data?.map((m: any) => ({
          id: m.id,
          content: m.content,
          senderId: m.sender_id,
          senderRole: m.sender_id === user?.id ? 'doctor' : 'mother',
          createdAt: m.created_at,
        })) || []
      );

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const { error } = await (supabase as any)
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          receiver_id: selectedConversation.patientId,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(selectedConversation.id);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
          >
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <View style={styles.avatarSmall}>
              <User size={20} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.chatHeaderName}>
                {selectedConversation.patientName}
              </Text>
              <Text style={styles.chatHeaderStatus}>Patient</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.senderRole === 'doctor'
                    ? styles.sentBubble
                    : styles.receivedBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.senderRole === 'doctor'
                      ? styles.sentText
                      : styles.receivedText,
                  ]}
                >
                  {message.content}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    message.senderRole === 'doctor'
                      ? styles.sentTime
                      : styles.receivedTime,
                  ]}
                >
                  {formatTime(message.createdAt)}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor="#9ca3af"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Send size={20} color={newMessage.trim() ? '#ffffff' : '#9ca3af'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>{conversations.length} conversations</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Conversation List */}
      <ScrollView style={styles.conversationList} showsVerticalScrollIndicator={false}>
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        ) : (
          filteredConversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationCard}
              onPress={() => setSelectedConversation(conversation)}
            >
              <View style={styles.avatar}>
                <User size={24} color="#ffffff" />
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.patientName}>{conversation.patientName}</Text>
                  <Text style={styles.timeText}>
                    {formatTime(conversation.lastMessageTime)}
                  </Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {conversation.lastMessage}
                </Text>
              </View>
              {conversation.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  conversationList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  unreadBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  // Chat View Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  sentBubble: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentText: {
    color: '#ffffff',
  },
  receivedText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  sentTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedTime: {
    color: '#9ca3af',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#111827',
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
});
