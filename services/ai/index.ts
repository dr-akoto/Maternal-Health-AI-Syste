/**
 * AI Services Index
 * Central export point for all AI-related services
 */

// Conversational Engine
export { aiConversationalEngine } from './AIConversationalEngine';
export type {
  ConversationContext,
  ConversationMessage,
  ExtractedSymptom,
  MedicalEntity,
  AIResponse,
  ReasoningTrace,
  UserRole,
  Intent,
  EmotionalTone,
} from './AIConversationalEngine';

export { diagnosticEngine } from './DiagnosticReasoningEngine';
export type {
  DiagnosticInput,
  DiagnosticResult,
  DifferentialCondition,
  Recommendation,
  ExplanationTrace,
  SymptomInput,
  PregnancyStage,
  MedicalHistory,
  VitalSignsInput,
} from './DiagnosticReasoningEngine';

export { agentOrchestrator } from './MultiAgentSystem';
export type {
  AgentInput,
  AgentContext,
  AgentOutput,
  OrchestratorResult,
  LearningOpportunity,
} from './MultiAgentSystem';

export { learningSystem } from './LearningSystem';
export type {
  ConversationRecord,
  LearningCandidate,
  ModelVersion,
  ValidationMetrics,
} from './LearningSystem';

export { explainabilityEngine } from './ExplainabilityEngine';
export type {
  ExplanationRequest,
  Explanation,
  PatientExplanation,
  ClinicalExplanation,
} from './ExplainabilityEngine.ts';
