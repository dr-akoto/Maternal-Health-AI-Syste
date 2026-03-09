import { supabase } from '@/lib/supabase';
import { RiskLevel } from '@/types/database.types';
import { aiConversationalEngine, AIResponse } from './ai/AIConversationalEngine';
import { diagnosticEngine, DiagnosticInput, DiagnosticResult } from './ai/DiagnosticReasoningEngine';
import { agentOrchestrator, OrchestratorResult } from './ai/MultiAgentSystem';
import { learningSystem } from './ai/LearningSystem';
import { explainabilityEngine, Explanation } from './ai/ExplainabilityEngine';

export interface SymptomInput {
  symptoms: string[];
  severity: string;
  description?: string;
}

export interface AITriageResult {
  riskLevel: RiskLevel;
  confidenceScore: number;
  recommendations: string[];
  explanation: string;
  requiresDoctorReview: boolean;
  reasoning?: any;
  disclaimer: string;
}

export interface ChatResponse {
  message: string;
  riskLevel: RiskLevel;
  intent: string;
  extractedSymptoms: any[];
  recommendations: string[];
  requiresEscalation: boolean;
  explanation: Explanation;
  confidence: number;
}

export const aiService = {
  /**
   * Analyze symptoms using the full AI pipeline
   */
  async analyzeSymptoms(
    motherId: string, 
    symptomInput: SymptomInput,
    pregnancyWeek?: number
  ): Promise<AITriageResult> {
    try {
      // Store symptoms in database
      const { data: symptomRecord, error: symptomError } = await (supabase as any)
        .from('symptoms')
        .insert({
          mother_id: motherId,
          symptoms: symptomInput.symptoms,
          severity: symptomInput.severity,
          description: symptomInput.description,
        })
        .select()
        .single();

      if (symptomError) throw symptomError;

      // Use diagnostic reasoning engine for analysis
      const diagnosticInput: DiagnosticInput = {
        symptoms: symptomInput.symptoms.map(s => ({
          name: s,
          severity: symptomInput.severity as any,
        })),
        pregnancyStage: {
          weeksGestation: pregnancyWeek || 20,
          trimester: pregnancyWeek ? (pregnancyWeek <= 12 ? 1 : pregnancyWeek <= 27 ? 2 : 3) : 2,
        },
        medicalHistory: {
          conditions: [],
          medications: [],
          allergies: [],
        },
        riskFactors: [],
      };

      const diagnosticResult = await diagnosticEngine.analyze(diagnosticInput);

      // Store assessment in database
      const { error: assessmentError } = await (supabase as any)
        .from('ai_assessments')
        .insert({
          symptom_id: symptomRecord.id,
          mother_id: motherId,
          risk_level: diagnosticResult.overallRiskLevel,
          confidence_score: diagnosticResult.confidence,
          recommendations: diagnosticResult.recommendations.map(r => r.description),
          decision_explanation: diagnosticResult.justification,
          ai_model_version: 'maternal-ai-v1.0',
          processing_time_ms: 250,
          requires_doctor_review: diagnosticResult.overallRiskLevel === 'level_3' || diagnosticResult.overallRiskLevel === 'level_4',
        });

      if (assessmentError) throw assessmentError;

      return {
        riskLevel: diagnosticResult.overallRiskLevel,
        confidenceScore: diagnosticResult.confidence,
        recommendations: diagnosticResult.recommendations.map(r => r.description),
        explanation: diagnosticResult.justification,
        requiresDoctorReview: diagnosticResult.overallRiskLevel === 'level_3' || diagnosticResult.overallRiskLevel === 'level_4',
        reasoning: diagnosticResult.explanationTrace,
        disclaimer: diagnosticResult.disclaimers[0],
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw error;
    }
  },

  /**
   * Chat with AI using the conversational engine
   */
  async chatWithAI(
    message: string,
    userId: string,
    userRole: 'mother' | 'doctor' = 'mother',
    sessionId?: string,
    pregnancyWeek?: number
  ): Promise<ChatResponse> {
    const session = sessionId || `session_${Date.now()}`;
    
    // Process through conversational engine
    const response = await aiConversationalEngine.processMessage(
      session,
      userId,
      userRole,
      message,
      pregnancyWeek
    );

    // Generate explanation
    const explanation = explainabilityEngine.generateExplanation({
      aiOutput: response,
      userRole,
      detailLevel: userRole === 'doctor' ? 'full' : 'summary',
      context: { pregnancyWeek, riskLevel: response.riskLevel },
    });

    // Store for learning
    await learningSystem.storeConversation(
      session,
      userId,
      [
        { role: 'user', content: message, timestamp: new Date() },
        { role: 'assistant', content: response.message, timestamp: new Date() },
      ],
      {
        symptoms: response.extractedSymptoms.map(s => s.name),
        riskLevel: response.riskLevel,
        pregnancyTrimester: pregnancyWeek ? (pregnancyWeek <= 12 ? 1 : pregnancyWeek <= 27 ? 2 : 3) : undefined,
        topIntent: response.intent,
        emotionalTone: 'neutral',
        escalationTriggered: response.requiresEscalation,
      },
      [{
        responseType: response.intent,
        confidence: response.confidence,
        agentsUsed: ['conversational_engine'],
        safetyFlags: response.requiresEscalation ? ['escalation_triggered'] : [],
      }]
    );

    return {
      message: response.message,
      riskLevel: response.riskLevel,
      intent: response.intent,
      extractedSymptoms: response.extractedSymptoms,
      recommendations: response.recommendations,
      requiresEscalation: response.requiresEscalation,
      explanation,
      confidence: response.confidence,
    };
  },

  /**
   * Get multi-agent response for complex queries
   */
  async getMultiAgentResponse(
    message: string,
    userId: string,
    userRole: 'mother' | 'doctor' = 'mother',
    context: {
      pregnancyWeek?: number;
      riskLevel?: RiskLevel;
      symptoms?: string[];
    } = {}
  ): Promise<OrchestratorResult> {
    const agentResult = await agentOrchestrator.process({
      message,
      userId,
      userRole,
      context: {
        pregnancyWeek: context.pregnancyWeek,
        riskLevel: context.riskLevel,
        previousMessages: [],
        symptoms: context.symptoms,
      },
    });

    return agentResult;
  },

  /**
   * Get diagnostic analysis for clinical decision support
   */
  async getDiagnosticAnalysis(input: DiagnosticInput): Promise<DiagnosticResult> {
    return diagnosticEngine.analyze(input);
  },

  /**
   * Get explanation for any AI output
   */
  getExplanation(
    aiOutput: any,
    userRole: 'mother' | 'doctor' | 'admin',
    context?: { pregnancyWeek?: number; symptoms?: string[]; riskLevel?: RiskLevel }
  ): Explanation {
    return explainabilityEngine.generateExplanation({
      aiOutput,
      userRole,
      detailLevel: userRole === 'doctor' ? 'full' : 'summary',
      context,
    });
  },

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
    await learningSystem.recordFeedback(conversationId, feedback);
  },

  /**
   * Get learning system statistics (admin only)
   */
  async getLearningStats() {
    return learningSystem.getLearningStats();
  },

  /**
   * Get current model version
   */
  async getModelVersion() {
    return learningSystem.getCurrentModelVersion();
  },
};

async function mockAITriage(input: SymptomInput): Promise<AITriageResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const severityMap: Record<string, RiskLevel> = {
    mild: 'level_1',
    moderate: 'level_2',
    severe: 'level_3',
    critical: 'level_4',
  };

  const riskLevel = severityMap[input.severity] || 'level_2';
  const requiresDoctorReview = riskLevel === 'level_3' || riskLevel === 'level_4';

  const recommendationsMap: Record<RiskLevel, string[]> = {
    level_1: [
      'Continue normal activities',
      'Monitor symptoms',
      'Stay hydrated',
      'Get adequate rest',
    ],
    level_2: [
      'Monitor symptoms closely',
      'Schedule a routine check-up',
      'Avoid strenuous activities',
      'Maintain healthy diet',
    ],
    level_3: [
      'Contact your doctor within 24 hours',
      'Avoid physical exertion',
      'Monitor vital signs',
      'Keep emergency contacts ready',
    ],
    level_4: [
      'Seek immediate medical attention',
      'Contact emergency services if symptoms worsen',
      'Have someone stay with you',
      'Prepare for hospital visit',
    ],
  };

  const explanations: Record<RiskLevel, string> = {
    level_1: 'Your symptoms appear to be mild and commonly associated with normal pregnancy changes. Continue monitoring and maintain regular prenatal care.',
    level_2: 'Your symptoms indicate a moderate level of concern. While not immediately dangerous, they should be monitored and discussed with your healthcare provider soon.',
    level_3: 'Your symptoms suggest a higher risk situation that requires medical evaluation within 24 hours. Contact your doctor to schedule an urgent appointment.',
    level_4: 'Your symptoms indicate a potentially serious condition requiring immediate medical attention. Please contact your doctor or visit the emergency room.',
  };

  return {
    riskLevel,
    confidenceScore: 0.85 + Math.random() * 0.1,
    recommendations: recommendationsMap[riskLevel],
    explanation: explanations[riskLevel],
    requiresDoctorReview,
    disclaimer: 'This AI assessment is for informational purposes only and does not replace professional medical advice. Always consult with your healthcare provider for proper diagnosis and treatment.',
  };
}
