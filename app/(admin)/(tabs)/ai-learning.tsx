import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react-native';
import { learningSystem, type LearningCandidate } from '@/services/ai/LearningSystem';

export default function AILearningScreen() {
  const [candidates, setCandidates] = useState<LearningCandidate[]>([]);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    pendingCandidates: 0,
    approvedCandidates: 0,
    rejectedCandidates: 0,
    modelAccuracy: 94,
  });

  useEffect(() => {
    fetchData();
  }, [selectedTab]);

  const fetchData = async () => {
    try {
      // Fetch learning stats
      const learningStats = await learningSystem.getLearningStats();
      setStats({
        totalCandidates: learningStats.totalConversations || 0,
        pendingCandidates: learningStats.pendingReview || 0,
        approvedCandidates: learningStats.approvedCandidates || 0,
        rejectedCandidates: 0,
        modelAccuracy: 94,
      });

      // Fetch candidates based on selected tab
      const fetchedCandidates = await learningSystem.getPendingCandidates();
      setCandidates(fetchedCandidates);
    } catch (error) {
      console.error('Error fetching AI learning data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleApprove = (candidate: LearningCandidate) => {
    Alert.alert(
      'Approve Learning Candidate',
      'This conversation will be added to the AI training dataset. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await learningSystem.approveLearningCandidate(candidate.id, 'admin');
              fetchData();
            } catch (error) {
              console.error('Error approving candidate:', error);
            }
          },
        },
      ]
    );
  };

  const handleReject = (candidate: LearningCandidate) => {
    Alert.alert(
      'Reject Learning Candidate',
      'This conversation will not be used for training. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await learningSystem.rejectLearningCandidate(candidate.id, 'admin', 'Rejected by admin');
              fetchData();
            } catch (error) {
              console.error('Error rejecting candidate:', error);
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: LearningCandidate['priority']) => {
    switch (priority) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Learning</Text>
          <Text style={styles.subtitle}>Manage AI training data</Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#f3e8ff' }]}>
            <Brain size={24} color="#7c3aed" />
            <Text style={[styles.statNumber, { color: '#7c3aed' }]}>{stats.modelAccuracy}%</Text>
            <Text style={styles.statLabel}>Model Accuracy</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
            <Clock size={24} color="#f59e0b" />
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.pendingCandidates}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
            <CheckCircle size={24} color="#22c55e" />
            <Text style={[styles.statNumber, { color: '#22c55e' }]}>{stats.approvedCandidates}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
            <XCircle size={24} color="#dc2626" />
            <Text style={[styles.statNumber, { color: '#dc2626' }]}>{stats.rejectedCandidates}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Candidates List */}
        <View style={styles.candidatesList}>
          {candidates.length === 0 ? (
            <View style={styles.emptyState}>
              <Brain size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No {selectedTab} candidates</Text>
            </View>
          ) : (
            candidates.map((candidate) => {
              const isExpanded = expandedCandidate === candidate.id;
              return (
                <View key={candidate.id} style={styles.candidateCard}>
                  <TouchableOpacity
                    style={styles.candidateHeader}
                    onPress={() => setExpandedCandidate(isExpanded ? null : candidate.id)}
                  >
                    <View style={styles.candidateInfo}>
                      <View style={styles.candidateType}>
                        <Brain size={16} color="#7c3aed" />
                        <Text style={styles.typeText}>{candidate.type}</Text>
                      </View>
                      <View
                        style={[
                          styles.confidenceBadge,
                          { backgroundColor: `${getPriorityColor(candidate.priority)}20` },
                        ]}
                      >
                        <TrendingUp size={12} color={getPriorityColor(candidate.priority)} />
                        <Text
                          style={[
                            styles.confidenceText,
                            { color: getPriorityColor(candidate.priority) },
                          ]}
                        >
                          {candidate.priority} priority
                        </Text>
                      </View>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color="#9ca3af" />
                    ) : (
                      <ChevronDown size={20} color="#9ca3af" />
                    )}
                  </TouchableOpacity>

                  <Text style={styles.candidateReason} numberOfLines={isExpanded ? undefined : 2}>
                    {candidate.description}
                  </Text>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      {/* Suggested Addition */}
                      {candidate.suggestedAddition && (
                        <View style={styles.dataSection}>
                          <Text style={styles.dataSectionTitle}>Suggested Addition</Text>
                          <View style={styles.dataPreview}>
                            <View style={styles.dataItem}>
                              <Text style={styles.dataLabel}>Category:</Text>
                              <Text style={styles.dataValue}>
                                {candidate.suggestedAddition.category}
                              </Text>
                            </View>
                            <View style={styles.dataItem}>
                              <Text style={styles.dataLabel}>Impact:</Text>
                              <Text style={styles.dataValue}>
                                {candidate.estimatedImpact}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Safety Notice */}
                      <View style={styles.safetyNotice}>
                        <AlertTriangle size={16} color="#f59e0b" />
                        <Text style={styles.safetyText}>
                          All personally identifiable information has been anonymized
                        </Text>
                      </View>

                      {/* Action Buttons */}
                      {selectedTab === 'pending' && (
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleReject(candidate)}
                          >
                            <XCircle size={18} color="#dc2626" />
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleApprove(candidate)}
                          >
                            <CheckCircle size={18} color="#ffffff" />
                            <Text style={styles.approveButtonText}>Approve</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  candidatesList: {
    paddingHorizontal: 20,
  },
  candidateCard: {
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
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  candidateReason: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  dataSection: {
    marginBottom: 16,
  },
  dataSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dataPreview: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  dataItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dataLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
    width: 80,
  },
  dataValue: {
    fontSize: 13,
    color: '#111827',
    flex: 1,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  safetyText: {
    fontSize: 12,
    color: '#92400e',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#fee2e2',
  },
  rejectButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  approveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
});
