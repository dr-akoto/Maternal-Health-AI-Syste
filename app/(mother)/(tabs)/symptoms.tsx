import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Brain,
  MessageCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  Thermometer,
  Heart,
  Zap,
  Droplets,
  Moon,
  X,
  Send,
  User,
  Bot,
  Sparkles,
  CheckCircle,
  Activity,
} from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';

const COMMON_SYMPTOMS = [
  { id: 1, name: 'Morning Sickness', icon: Droplets, color: '#10B981', bgColor: '#D1FAE5' },
  { id: 2, name: 'Headache', icon: Zap, color: '#F59E0B', bgColor: '#FEF3C7' },
  { id: 3, name: 'Fatigue', icon: Moon, color: '#10B981', bgColor: '#D1FAE5' },
  { id: 4, name: 'Back Pain', icon: Activity, color: '#EC4899', bgColor: '#FCE7F3' },
  { id: 5, name: 'Cramps', icon: AlertCircle, color: '#EF4444', bgColor: '#FEE2E2' },
  { id: 6, name: 'Fever', icon: Thermometer, color: '#F97316', bgColor: '#FFEDD5' },
];

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function SymptomsScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<number[]>([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const recentAssessments = [
    { id: 1, date: 'Today, 9:30 AM', symptom: 'Mild Headache', risk: 'low', recommendation: 'Rest and stay hydrated' },
    { id: 2, date: 'Yesterday', symptom: 'Morning Sickness', risk: 'normal', recommendation: 'Eat small, frequent meals' },
    { id: 3, date: '2 days ago', symptom: 'Back Pain', risk: 'low', recommendation: 'Light stretching exercises' },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const toggleSymptom = (id: number) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const sendMessage = () => {
    if (!messageInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageInput,
      isUser: true,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(messageInput),
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (question: string): string => {
    const responses = [
      "Based on what you've described, this appears to be a common pregnancy symptom. I recommend resting and staying well hydrated. If symptoms persist or worsen, please consult your healthcare provider.",
      "Thank you for sharing. Many pregnant women experience similar symptoms during this stage. Try eating smaller meals throughout the day and avoid lying down immediately after eating.",
      "I understand your concern. What you're experiencing sounds normal, but monitoring is important. Would you like me to help you track this symptom or connect you with your doctor?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#10B981';
      case 'normal': return '#3B82F6';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const submitSymptoms = () => {
    // Simulate submission
    setShowReportModal(false);
    setSelectedSymptoms([]);
    setAdditionalNotes('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerDecor1} />
          <View style={styles.headerDecor2} />
          
          <View style={styles.headerContent}>
            <Brain size={32} color="#fff" />
            <Text style={styles.headerTitle}>AI Symptom Checker</Text>
            <Text style={styles.headerSubtitle}>
              Report symptoms and get AI-powered health insights
            </Text>
          </View>
        </LinearGradient>

        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.mainActionCard}
              onPress={() => setShowReportModal(true)}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainActionGradient}
              >
                <View style={styles.mainActionIcon}>
                  <Activity size={28} color="#10B981" />
                </View>
                <View style={styles.mainActionContent}>
                  <Text style={styles.mainActionTitle}>Report Symptoms</Text>
                  <Text style={styles.mainActionSubtitle}>
                    Get instant AI analysis and recommendations
                  </Text>
                </View>
                <ChevronRight size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.chatActionCard}
              onPress={() => setShowChatModal(true)}
            >
              <View style={styles.chatActionIcon}>
                <MessageCircle size={24} color="#10B981" />
              </View>
              <View style={styles.chatActionContent}>
                <Text style={styles.chatActionTitle}>Chat with AI</Text>
                <Text style={styles.chatActionSubtitle}>
                  Ask health questions anytime
                </Text>
              </View>
              <View style={styles.chatBadge}>
                <Sparkles size={12} color="#10B981" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Common Symptoms Quick Select */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Check</Text>
            <Text style={styles.sectionSubtitle}>
              Experiencing any of these symptoms?
            </Text>
            <View style={styles.symptomsGrid}>
              {COMMON_SYMPTOMS.map(symptom => {
                const IconComponent = symptom.icon;
                const isSelected = selectedSymptoms.includes(symptom.id);
                return (
                  <TouchableOpacity 
                    key={symptom.id}
                    style={[
                      styles.symptomChip,
                      { backgroundColor: symptom.bgColor },
                      isSelected && styles.symptomChipSelected,
                    ]}
                    onPress={() => toggleSymptom(symptom.id)}
                  >
                    <IconComponent size={18} color={symptom.color} />
                    <Text style={[styles.symptomChipText, { color: symptom.color }]}>
                      {symptom.name}
                    </Text>
                    {isSelected && (
                      <CheckCircle size={14} color={symptom.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedSymptoms.length > 0 && (
              <TouchableOpacity 
                style={styles.analyzeButton}
                onPress={() => setShowReportModal(true)}
              >
                <Text style={styles.analyzeButtonText}>
                  Analyze {selectedSymptoms.length} symptom{selectedSymptoms.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Recent Assessments */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Assessments</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentAssessments.map((assessment, index) => (
              <TouchableOpacity key={assessment.id} style={styles.assessmentCard}>
                <View style={styles.assessmentHeader}>
                  <View style={[styles.riskDot, { backgroundColor: getRiskColor(assessment.risk) }]} />
                  <Text style={styles.assessmentSymptom}>{assessment.symptom}</Text>
                  <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor(assessment.risk)}15` }]}>
                    <Text style={[styles.riskText, { color: getRiskColor(assessment.risk) }]}>
                      {assessment.risk.charAt(0).toUpperCase() + assessment.risk.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.assessmentRecommendation}>
                  {assessment.recommendation}
                </Text>
                <View style={styles.assessmentFooter}>
                  <Clock size={14} color="#9CA3AF" />
                  <Text style={styles.assessmentDate}>{assessment.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Health Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsIcon}>
              <Sparkles size={20} color="#F59E0B" />
            </View>
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Pro Tip</Text>
              <Text style={styles.tipsText}>
                Tracking symptoms regularly helps identify patterns and keeps your healthcare team informed.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.aiAvatar}>
                <Bot size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.modalTitle}>AI Health Assistant</Text>
                <Text style={styles.modalSubtitle}>Always here to help</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowChatModal(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
            {chatMessages.length === 0 ? (
              <View style={styles.emptyChat}>
                <View style={styles.emptyChatIcon}>
                  <Brain size={48} color="#10B981" />
                </View>
                <Text style={styles.emptyChatTitle}>Ask me anything!</Text>
                <Text style={styles.emptyChatText}>
                  I'm here to help answer your pregnancy and health-related questions.
                </Text>
                <View style={styles.suggestionsContainer}>
                  {['How can I reduce morning sickness?', 'Is mild cramping normal?', 'What foods should I avoid?'].map((suggestion, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() => {
                        setMessageInput(suggestion);
                      }}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              chatMessages.map(message => (
                <View 
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.isUser ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  {!message.isUser && (
                    <View style={styles.messageAvatar}>
                      <Bot size={16} color="#fff" />
                    </View>
                  )}
                  <View style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.aiBubble,
                  ]}>
                    <Text style={[
                      styles.messageText,
                      message.isUser ? styles.userMessageText : styles.aiMessageText,
                    ]}>
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))
            )}
            {isTyping && (
              <View style={styles.typingIndicator}>
                <View style={styles.messageAvatar}>
                  <Bot size={16} color="#fff" />
                </View>
                <View style={styles.typingBubble}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
                  <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type your question..."
              placeholderTextColor="#9CA3AF"
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !messageInput.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!messageInput.trim()}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Report Symptoms Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Report Symptoms</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowReportModal(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.reportContent}>
            <Text style={styles.reportLabel}>Select your symptoms:</Text>
            <View style={styles.symptomsGridModal}>
              {COMMON_SYMPTOMS.map(symptom => {
                const IconComponent = symptom.icon;
                const isSelected = selectedSymptoms.includes(symptom.id);
                return (
                  <TouchableOpacity 
                    key={symptom.id}
                    style={[
                      styles.symptomCardModal,
                      isSelected && { borderColor: symptom.color, borderWidth: 2 },
                    ]}
                    onPress={() => toggleSymptom(symptom.id)}
                  >
                    <View style={[styles.symptomIconModal, { backgroundColor: symptom.bgColor }]}>
                      <IconComponent size={24} color={symptom.color} />
                    </View>
                    <Text style={styles.symptomNameModal}>{symptom.name}</Text>
                    {isSelected && (
                      <CheckCircle size={20} color={symptom.color} style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.reportLabel, { marginTop: 20 }]}>Additional Notes (optional):</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Describe how you're feeling..."
              placeholderTextColor="#9CA3AF"
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity 
              style={[styles.submitButton, selectedSymptoms.length === 0 && styles.submitButtonDisabled]}
              onPress={submitSymptoms}
              disabled={selectedSymptoms.length === 0}
            >
              <LinearGradient
                colors={selectedSymptoms.length > 0 ? ['#10B981', '#059669'] : ['#D1D5DB', '#E5E7EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Brain size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Analyze with AI</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerDecor2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  content: {
    marginTop: -24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  quickActions: {
    marginBottom: 24,
  },
  mainActionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mainActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  mainActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mainActionContent: {
    flex: 1,
  },
  mainActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  mainActionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  chatActionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chatActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  chatActionContent: {
    flex: 1,
  },
  chatActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  chatActionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  chatBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 8,
  },
  symptomChipSelected: {
    borderWidth: 2,
    borderColor: 'currentColor',
  },
  symptomChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  assessmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  assessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  assessmentSymptom: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assessmentRecommendation: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 10,
  },
  assessmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assessmentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    color: '#B45309',
    lineHeight: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyChatIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyChatTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyChatText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionChip: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#10B981',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: '#1F2937',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    color: '#1F2937',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  // Report Modal Styles
  reportContent: {
    flex: 1,
    padding: 20,
  },
  reportLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  symptomsGridModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomCardModal: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  symptomIconModal: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  symptomNameModal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  notesInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    height: 120,
    textAlignVertical: 'top',
    color: '#1F2937',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
