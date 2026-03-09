import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Sparkles,
  AlertTriangle,
  Heart,
  Info,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { aiService } from '@/services/aiService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

const QUICK_PROMPTS = [
  "I'm feeling nauseous",
  "I have a headache",
  "My feet are swollen",
  "I feel very tired",
  "What should I eat today?",
];

export default function AIChatScreen() {
  const router = useRouter();
  const { user, motherProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello${motherProfile?.full_name ? ` ${motherProfile.full_name.split(' ')[0]}` : ''}! 👋 I'm your AI health assistant. I can help you understand your symptoms, provide health guidance, and answer questions about your pregnancy. How can I help you today?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    // Add typing indicator
    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: typingId, text: '', isUser: false, timestamp: new Date(), isTyping: true },
    ]);

    try {
      // Get AI response
      const response = await aiService.analyzeSymptoms(
        user?.id || '',
        {
          symptoms: [text.trim()],
          severity: 'moderate',
          description: text.trim(),
        },
        motherProfile?.pregnancy_week || 20
      );

      // Build response message from AI analysis
      const aiMessage = response.explanation || 
        (response.recommendations.length > 0 
          ? response.recommendations.join('\n\n')
          : "I understand. Could you tell me more about how you're feeling?");

      // Remove typing indicator and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: aiMessage,
            isUser: false,
            timestamp: new Date(),
          },
        ];
      });

      // Check if AI flagged any concerns (level_3 = high, level_4 = emergency)
      if (response.riskLevel === 'level_3' || response.riskLevel === 'level_4' || response.requiresDoctorReview) {
        setMessages((prev) => [
          ...prev,
          {
            id: `warning-${Date.now()}`,
            text: '⚠️ Based on what you described, I recommend contacting your healthcare provider soon. Would you like me to help you report this to your doctor?',
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== typingId);
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: "I'm having trouble connecting right now. Please try again in a moment, or contact your healthcare provider if you have urgent concerns.",
            isUser: false,
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    if (message.isTyping) {
      return (
        <View key={message.id} style={[styles.messageContainer, styles.aiMessageContainer]}>
          <View style={styles.aiAvatar}>
            <Bot size={18} color="#10B981" />
          </View>
          <View style={[styles.messageBubble, styles.aiMessage]}>
            <ActivityIndicator size="small" color="#10B981" />
          </View>
        </View>
      );
    }

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!message.isUser && (
          <View style={styles.aiAvatar}>
            <Bot size={18} color="#10B981" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            message.isUser ? styles.userMessage : styles.aiMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              message.isUser ? styles.userMessageText : styles.aiMessageText,
            ]}
          >
            {message.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              message.isUser ? styles.userTimestamp : styles.aiTimestamp,
            ]}
          >
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {message.isUser && (
          <View style={styles.userAvatar}>
            <User size={18} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Sparkles size={20} color="#10B981" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Health Assistant</Text>
            <Text style={styles.headerSubtitle}>Always here to help</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <Info size={22} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <AlertTriangle size={16} color="#F59E0B" />
        <Text style={styles.disclaimerText}>
          This AI provides general guidance only. For medical emergencies, contact your doctor or call emergency services.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
        </ScrollView>

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickPromptsContainer}
            contentContainerStyle={styles.quickPromptsContent}
          >
            {QUICK_PROMPTS.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickPrompt}
                onPress={() => sendMessage(prompt)}
              >
                <Text style={styles.quickPromptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || loading}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  infoButton: {
    padding: 4,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  aiMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    backgroundColor: '#10B981',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  aiMessageText: {
    color: '#1F2937',
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  quickPromptsContainer: {
    maxHeight: 50,
  },
  quickPromptsContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  quickPrompt: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  quickPromptText: {
    fontSize: 13,
    color: '#4B5563',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#1F2937',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});
