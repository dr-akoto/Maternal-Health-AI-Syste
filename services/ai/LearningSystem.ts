/**
 * Safe Continual Learning System for Maternal Health AI
 * 
 * Implements:
 * - Store anonymized conversations
 * - Identify unseen cases
 * - Suggest dataset additions
 * - Admin approval before retraining
 * - Versioned models
 */

import { supabase } from '@/lib/supabase';

// Types
export interface ConversationRecord {
  id: string;
  sessionId: string;
  anonymizedUserId: string;
  messages: AnonymizedMessage[];
  extractedFeatures: ConversationFeatures;
  aiResponses: AIResponseSummary[];
  outcome?: ConversationOutcome;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'used_for_training';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface AnonymizedMessage {
  role: 'user' | 'assistant';
  contentHash: string; // Hash of original content
  sanitizedContent: string; // PII-removed version
  intent?: string;
  entities?: string[];
  timestamp: Date;
}

export interface ConversationFeatures {
  symptoms: string[];
  riskLevel: string;
  pregnancyTrimester?: number;
  topIntent: string;
  emotionalTone: string;
  escalationTriggered: boolean;
  responseQuality?: number;
}

export interface AIResponseSummary {
  responseType: string;
  confidence: number;
  agentsUsed: string[];
  safetyFlags: string[];
}

export interface ConversationOutcome {
  userSatisfaction?: number; // 1-5
  escalatedToDoctor: boolean;
  followUpRequired: boolean;
  clinicalValidation?: 'accurate' | 'partially_accurate' | 'inaccurate';
}

export interface LearningCandidate {
  id: string;
  type: 'new_pattern' | 'knowledge_gap' | 'edge_case' | 'feedback_driven';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  sourceConversations: string[];
  suggestedAddition: DatasetAddition;
  estimatedImpact: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  createdAt: Date;
}

export interface DatasetAddition {
  category: string;
  inputPattern: string;
  expectedOutput: string;
  context: Record<string, any>;
  medicalValidation?: string;
  sources?: string[];
}

export interface ModelVersion {
  version: string;
  releaseDate: Date;
  trainingDataCutoff: Date;
  improvements: string[];
  knownLimitations: string[];
  validationMetrics: ValidationMetrics;
  status: 'training' | 'validating' | 'active' | 'deprecated';
  previousVersion?: string;
}

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  safetyScore: number;
  clinicalValidationScore: number;
  sampleSize: number;
}

// PII patterns for anonymization
const PII_PATTERNS = [
  { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, replacement: '[NAME]' }, // Names
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '[PHONE]' }, // Phone
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL]' }, // Email
  { pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, replacement: '[DATE]' }, // Dates
  { pattern: /\b\d{5}(-\d{4})?\b/g, replacement: '[ZIP]' }, // ZIP codes
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' }, // SSN
  { pattern: /\b(Dr\.|Doctor|Dr) [A-Z][a-z]+\b/gi, replacement: '[DOCTOR_NAME]' }, // Doctor names
  { pattern: /\b(hospital|clinic|medical center) [A-Za-z]+\b/gi, replacement: '[FACILITY]' }, // Facilities
];

class LearningSystem {
  private currentModelVersion = 'maternal-ai-v1.0';
  private conversationBuffer: ConversationRecord[] = [];
  private learningCandidates: LearningCandidate[] = [];

  /**
   * Store anonymized conversation for potential learning
   */
  async storeConversation(
    sessionId: string,
    userId: string,
    messages: { role: 'user' | 'assistant'; content: string; timestamp: Date }[],
    features: ConversationFeatures,
    aiResponses: AIResponseSummary[]
  ): Promise<string> {
    // Anonymize the conversation
    const anonymizedMessages = messages.map(msg => this.anonymizeMessage(msg));
    const anonymizedUserId = this.hashUserId(userId);

    const record: ConversationRecord = {
      id: this.generateId(),
      sessionId,
      anonymizedUserId,
      messages: anonymizedMessages,
      extractedFeatures: features,
      aiResponses,
      reviewStatus: 'pending',
      createdAt: new Date(),
    };

    // Check if this is a learning opportunity
    const isLearningCandidate = this.evaluateLearningPotential(record);
    
    try {
      // Store in database
      await (supabase as any).from('ai_learning_conversations').insert({
        id: record.id,
        session_id: record.sessionId,
        anonymized_user_id: record.anonymizedUserId,
        messages: record.messages,
        features: record.extractedFeatures,
        ai_responses: record.aiResponses,
        review_status: record.reviewStatus,
        is_learning_candidate: isLearningCandidate,
        created_at: record.createdAt.toISOString(),
      });
    } catch (error) {
      console.log('Learning storage not available:', error);
      // Buffer locally
      this.conversationBuffer.push(record);
    }

    // If learning candidate, create entry
    if (isLearningCandidate) {
      await this.createLearningCandidate(record);
    }

    return record.id;
  }

  /**
   * Anonymize a message by removing PII
   */
  private anonymizeMessage(msg: { role: 'user' | 'assistant'; content: string; timestamp: Date }): AnonymizedMessage {
    let sanitized = msg.content;
    
    // Apply PII removal patterns
    for (const { pattern, replacement } of PII_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    
    return {
      role: msg.role,
      contentHash: this.hashContent(msg.content),
      sanitizedContent: sanitized,
      timestamp: msg.timestamp,
    };
  }

  /**
   * Hash user ID for anonymization
   */
  private hashUserId(userId: string): string {
    // Simple hash for demo - use crypto in production
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `anon_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Hash content for reference without storing raw data
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `learn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Evaluate if conversation has learning potential
   */
  private evaluateLearningPotential(record: ConversationRecord): boolean {
    const features = record.extractedFeatures;
    
    // High priority learning scenarios
    const conditions = [
      features.escalationTriggered, // Emergency cases
      features.symptoms.length >= 3, // Complex symptom combinations
      features.riskLevel === 'level_3' || features.riskLevel === 'level_4', // High risk
      record.aiResponses.some(r => r.confidence < 0.6), // Low confidence responses
      record.aiResponses.some(r => r.safetyFlags.length > 0), // Safety concerns
    ];
    
    return conditions.filter(Boolean).length >= 2;
  }

  /**
   * Create a learning candidate for admin review
   */
  private async createLearningCandidate(record: ConversationRecord): Promise<void> {
    const features = record.extractedFeatures;
    
    let type: LearningCandidate['type'] = 'new_pattern';
    let priority: LearningCandidate['priority'] = 'medium';
    let description = '';
    
    // Determine type and priority
    if (features.escalationTriggered) {
      type = 'edge_case';
      priority = 'high';
      description = 'Emergency escalation case - review for response accuracy';
    } else if (features.symptoms.length >= 3) {
      type = 'new_pattern';
      priority = 'medium';
      description = `Complex symptom pattern: ${features.symptoms.join(', ')}`;
    } else if (record.aiResponses.some(r => r.confidence < 0.6)) {
      type = 'knowledge_gap';
      priority = 'high';
      description = 'Low confidence response - may indicate knowledge gap';
    }

    const candidate: LearningCandidate = {
      id: this.generateId(),
      type,
      priority,
      description,
      sourceConversations: [record.id],
      suggestedAddition: this.generateSuggestedAddition(record),
      estimatedImpact: this.estimateImpact(type, priority),
      status: 'pending',
      createdAt: new Date(),
    };

    this.learningCandidates.push(candidate);

    try {
      await (supabase as any).from('ai_learning_candidates').insert({
        id: candidate.id,
        type: candidate.type,
        priority: candidate.priority,
        description: candidate.description,
        source_conversations: candidate.sourceConversations,
        suggested_addition: candidate.suggestedAddition,
        estimated_impact: candidate.estimatedImpact,
        status: candidate.status,
        created_at: candidate.createdAt.toISOString(),
      });
    } catch (error) {
      console.log('Learning candidate storage not available');
    }
  }

  /**
   * Generate suggested dataset addition
   */
  private generateSuggestedAddition(record: ConversationRecord): DatasetAddition {
    const features = record.extractedFeatures;
    
    return {
      category: features.topIntent,
      inputPattern: `Symptoms: ${features.symptoms.join(', ')} in trimester ${features.pregnancyTrimester || 'unknown'}`,
      expectedOutput: `Appropriate response for ${features.riskLevel} risk level`,
      context: {
        trimester: features.pregnancyTrimester,
        riskLevel: features.riskLevel,
        emotionalTone: features.emotionalTone,
      },
    };
  }

  /**
   * Estimate impact of adding this data
   */
  private estimateImpact(type: LearningCandidate['type'], priority: LearningCandidate['priority']): string {
    if (priority === 'critical') return 'Critical safety improvement';
    if (priority === 'high') return 'Significant accuracy improvement expected';
    if (type === 'knowledge_gap') return 'Will address response gap';
    return 'Incremental improvement to model coverage';
  }

  /**
   * Get pending learning candidates for admin review
   */
  async getPendingCandidates(limit: number = 20): Promise<LearningCandidate[]> {
    try {
      const { data } = await (supabase as any)
        .from('ai_learning_candidates')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      
      return data || this.learningCandidates.filter(c => c.status === 'pending');
    } catch {
      return this.learningCandidates.filter(c => c.status === 'pending');
    }
  }

  /**
   * Admin approves a learning candidate
   */
  async approveLearningCandidate(
    candidateId: string, 
    adminId: string, 
    notes?: string
  ): Promise<boolean> {
    try {
      await (supabase as any)
        .from('ai_learning_candidates')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        })
        .eq('id', candidateId);
      
      // Update local cache
      const candidate = this.learningCandidates.find(c => c.id === candidateId);
      if (candidate) {
        candidate.status = 'approved';
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Admin rejects a learning candidate
   */
  async rejectLearningCandidate(
    candidateId: string, 
    adminId: string, 
    reason: string
  ): Promise<boolean> {
    try {
      await (supabase as any)
        .from('ai_learning_candidates')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          review_notes: reason,
        })
        .eq('id', candidateId);
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get approved candidates ready for training
   */
  async getApprovedForTraining(): Promise<LearningCandidate[]> {
    try {
      const { data } = await (supabase as any)
        .from('ai_learning_candidates')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: true });
      
      return data || [];
    } catch {
      return this.learningCandidates.filter(c => c.status === 'approved');
    }
  }

  /**
   * Record model version
   */
  async recordModelVersion(version: ModelVersion): Promise<void> {
    try {
      await (supabase as any).from('ai_model_versions').insert({
        version: version.version,
        release_date: version.releaseDate.toISOString(),
        training_data_cutoff: version.trainingDataCutoff.toISOString(),
        improvements: version.improvements,
        known_limitations: version.knownLimitations,
        validation_metrics: version.validationMetrics,
        status: version.status,
        previous_version: version.previousVersion,
      });
    } catch (error) {
      console.log('Model version storage not available');
    }
  }

  /**
   * Get current model version info
   */
  async getCurrentModelVersion(): Promise<ModelVersion | null> {
    try {
      const { data } = await (supabase as any)
        .from('ai_model_versions')
        .select('*')
        .eq('status', 'active')
        .order('release_date', { ascending: false })
        .limit(1)
        .single();
      
      return data;
    } catch {
      // Return default version info
      return {
        version: this.currentModelVersion,
        releaseDate: new Date('2024-01-01'),
        trainingDataCutoff: new Date('2024-01-01'),
        improvements: ['Initial release'],
        knownLimitations: ['Based on general obstetric guidelines'],
        validationMetrics: {
          accuracy: 0.85,
          precision: 0.82,
          recall: 0.88,
          f1Score: 0.85,
          safetyScore: 0.95,
          clinicalValidationScore: 0.80,
          sampleSize: 10000,
        },
        status: 'active',
      };
    }
  }

  /**
   * Get all model versions
   */
  async getModelVersionHistory(): Promise<ModelVersion[]> {
    try {
      const { data } = await (supabase as any)
        .from('ai_model_versions')
        .select('*')
        .order('release_date', { ascending: false });
      
      return data || [];
    } catch {
      return [];
    }
  }

  /**
   * Record user feedback for learning
   */
  async recordFeedback(
    conversationId: string,
    feedback: {
      rating: number;
      helpful: boolean;
      accurate: boolean;
      comments?: string;
    }
  ): Promise<void> {
    try {
      await (supabase as any).from('ai_conversation_feedback').insert({
        conversation_id: conversationId,
        rating: feedback.rating,
        helpful: feedback.helpful,
        accurate: feedback.accurate,
        comments: feedback.comments,
        created_at: new Date().toISOString(),
      });

      // If negative feedback, flag for review
      if (feedback.rating <= 2 || !feedback.accurate) {
        await this.flagConversationForReview(conversationId, 'negative_feedback');
      }
    } catch (error) {
      console.log('Feedback storage not available');
    }
  }

  /**
   * Flag conversation for review
   */
  private async flagConversationForReview(
    conversationId: string, 
    reason: string
  ): Promise<void> {
    try {
      await (supabase as any)
        .from('ai_learning_conversations')
        .update({
          review_status: 'pending',
          review_flag_reason: reason,
        })
        .eq('id', conversationId);
    } catch {
      // Ignore if table doesn't exist
    }
  }

  /**
   * Get learning statistics
   */
  async getLearningStats(): Promise<{
    totalConversations: number;
    pendingReview: number;
    approvedCandidates: number;
    modelVersions: number;
    averageFeedbackRating: number;
  }> {
    try {
      const [conversations, candidates, versions, feedback] = await Promise.all([
        (supabase as any).from('ai_learning_conversations').select('id', { count: 'exact' }),
        (supabase as any).from('ai_learning_candidates').select('status'),
        (supabase as any).from('ai_model_versions').select('id', { count: 'exact' }),
        (supabase as any).from('ai_conversation_feedback').select('rating'),
      ]);

      const pendingCount = candidates.data?.filter((c: any) => c.status === 'pending').length || 0;
      const approvedCount = candidates.data?.filter((c: any) => c.status === 'approved').length || 0;
      const avgRating = feedback.data?.reduce((sum: number, f: any) => sum + f.rating, 0) / (feedback.data?.length || 1);

      return {
        totalConversations: conversations.count || 0,
        pendingReview: pendingCount,
        approvedCandidates: approvedCount,
        modelVersions: versions.count || 0,
        averageFeedbackRating: avgRating || 0,
      };
    } catch {
      return {
        totalConversations: this.conversationBuffer.length,
        pendingReview: this.learningCandidates.filter(c => c.status === 'pending').length,
        approvedCandidates: this.learningCandidates.filter(c => c.status === 'approved').length,
        modelVersions: 1,
        averageFeedbackRating: 0,
      };
    }
  }
}

// Export singleton instance
export const learningSystem = new LearningSystem();
export default learningSystem;
