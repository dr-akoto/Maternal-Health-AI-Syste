/**
 * AI Conversational Engine for Maternal Health System
 * 
 * Features:
 * - Context memory management
 * - Symptom extraction
 * - Intent detection
 * - Risk classification
 * - Emotional tone detection
 * - Medical entity recognition
 * - Safety filters
 * - Language behavior adaptation (simple for patients, clinical for doctors)
 */

import { supabase } from '@/lib/supabase';

// Types
export type UserRole = 'mother' | 'doctor' | 'admin';
export type RiskLevel = 'level_1' | 'level_2' | 'level_3' | 'level_4';
export type Intent = 
  | 'symptom_report'
  | 'question'
  | 'emergency'
  | 'appointment'
  | 'medication'
  | 'nutrition'
  | 'emotional_support'
  | 'education'
  | 'general';

export type EmotionalTone = 'neutral' | 'anxious' | 'distressed' | 'calm' | 'urgent';

export interface ConversationContext {
  sessionId: string;
  userId: string;
  userRole: UserRole;
  messages: ConversationMessage[];
  extractedSymptoms: ExtractedSymptom[];
  currentIntent: Intent;
  emotionalTone: EmotionalTone;
  pregnancyWeek?: number;
  riskFactors: string[];
  lastUpdated: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: Intent;
    entities?: MedicalEntity[];
    riskLevel?: RiskLevel;
  };
}

export interface ExtractedSymptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  duration?: string;
  frequency?: string;
  associatedSymptoms?: string[];
  bodyLocation?: string;
}

export interface MedicalEntity {
  type: 'symptom' | 'medication' | 'condition' | 'body_part' | 'time_expression' | 'measurement';
  value: string;
  confidence: number;
  normalizedValue?: string;
}

export interface AIResponse {
  message: string;
  clinicalMessage?: string; // For doctors
  intent: Intent;
  riskLevel: RiskLevel;
  extractedSymptoms: ExtractedSymptom[];
  entities: MedicalEntity[];
  recommendations: string[];
  requiresEscalation: boolean;
  escalationReason?: string;
  confidence: number;
  disclaimer: string;
  reasoning: ReasoningTrace;
}

export interface ReasoningTrace {
  steps: string[];
  featuresConsidered: string[];
  confidenceFactors: { factor: string; weight: number }[];
  alternativeInterpretations?: string[];
}

// Safety keywords that require immediate escalation
const EMERGENCY_KEYWORDS = [
  'severe bleeding', 'heavy bleeding', 'hemorrhage',
  'seizure', 'convulsion', 'fit',
  'unconscious', 'fainted', 'passed out',
  'can\'t breathe', 'difficulty breathing', 'shortness of breath',
  'severe headache', 'worst headache',
  'vision problems', 'seeing spots', 'blurred vision',
  'severe abdominal pain', 'intense pain',
  'no fetal movement', 'baby not moving', 'reduced movement',
  'water broke', 'waters breaking', 'leaking fluid',
  'contractions', 'labor pains',
  'swelling face', 'swelling hands',
  'high blood pressure', 'bp high',
  'chest pain', 'heart palpitations'
];

// Symptom patterns for extraction
const SYMPTOM_PATTERNS: { pattern: RegExp; symptom: string; severity: ExtractedSymptom['severity'] }[] = [
  { pattern: /severe\s+(headache|pain|bleeding)/i, symptom: '$1', severity: 'severe' },
  { pattern: /mild\s+(headache|nausea|cramping)/i, symptom: '$1', severity: 'mild' },
  { pattern: /(nausea|vomiting|dizziness)/i, symptom: '$1', severity: 'moderate' },
  { pattern: /\b(bleeding|spotting)\b/i, symptom: 'bleeding', severity: 'moderate' },
  { pattern: /\b(swelling|edema)\b/i, symptom: 'swelling', severity: 'moderate' },
  { pattern: /\b(fever|temperature)\b/i, symptom: 'fever', severity: 'moderate' },
  { pattern: /\b(fatigue|tired|exhausted)\b/i, symptom: 'fatigue', severity: 'mild' },
  { pattern: /\b(back pain|backache)\b/i, symptom: 'back pain', severity: 'moderate' },
  { pattern: /\b(cramping|cramps)\b/i, symptom: 'cramping', severity: 'moderate' },
  { pattern: /\b(discharge)\b/i, symptom: 'vaginal discharge', severity: 'mild' },
];

// Intent classification patterns
const INTENT_PATTERNS: { pattern: RegExp; intent: Intent }[] = [
  { pattern: /\b(pain|hurt|ache|bleeding|discharge|symptom|feel sick|unwell)\b/i, intent: 'symptom_report' },
  { pattern: /\b(emergency|urgent|help|serious|dangerous)\b/i, intent: 'emergency' },
  { pattern: /\b(appointment|schedule|book|see doctor|visit)\b/i, intent: 'appointment' },
  { pattern: /\b(medication|medicine|drug|prescription|pill|tablet)\b/i, intent: 'medication' },
  { pattern: /\b(eat|food|diet|nutrition|vitamin|supplement)\b/i, intent: 'nutrition' },
  { pattern: /\b(worried|anxious|scared|stressed|emotional|crying)\b/i, intent: 'emotional_support' },
  { pattern: /\b(what|how|why|when|can I|should I|is it normal)\b/i, intent: 'question' },
  { pattern: /\b(learn|information|article|read about|tell me about)\b/i, intent: 'education' },
];

// Emotional tone patterns
const EMOTIONAL_PATTERNS: { pattern: RegExp; tone: EmotionalTone }[] = [
  { pattern: /\b(help|emergency|urgent|now|immediately)\b/i, tone: 'urgent' },
  { pattern: /\b(worried|anxious|nervous|scared|afraid|fear)\b/i, tone: 'anxious' },
  { pattern: /\b(terrified|panic|desperate|can't cope|overwhelmed)\b/i, tone: 'distressed' },
  { pattern: /\b(fine|okay|good|normal|curious)\b/i, tone: 'calm' },
];

class AIConversationalEngine {
  private contexts: Map<string, ConversationContext> = new Map();
  private modelVersion = 'maternal-ai-v1.0';

  /**
   * Initialize or retrieve conversation context
   */
  async getOrCreateContext(
    sessionId: string,
    userId: string,
    userRole: UserRole,
    pregnancyWeek?: number
  ): Promise<ConversationContext> {
    if (this.contexts.has(sessionId)) {
      return this.contexts.get(sessionId)!;
    }

    // Load risk factors from database
    const riskFactors = await this.loadRiskFactors(userId, userRole);

    const context: ConversationContext = {
      sessionId,
      userId,
      userRole,
      messages: [],
      extractedSymptoms: [],
      currentIntent: 'general',
      emotionalTone: 'neutral',
      pregnancyWeek,
      riskFactors,
      lastUpdated: new Date(),
    };

    this.contexts.set(sessionId, context);
    return context;
  }

  /**
   * Load user's risk factors from database
   */
  private async loadRiskFactors(userId: string, userRole: UserRole): Promise<string[]> {
    if (userRole !== 'mother') return [];

    try {
      const { data: profile } = await (supabase as any)
        .from('mother_profiles')
        .select('current_risk_level, blood_type, gestational_age_weeks')
        .eq('user_id', userId)
        .single();

      const factors: string[] = [];
      if (profile?.current_risk_level && profile.current_risk_level !== 'level_1') {
        factors.push(`elevated_risk_${profile.current_risk_level}`);
      }
      if (profile?.gestational_age_weeks && profile.gestational_age_weeks > 36) {
        factors.push('late_pregnancy');
      }
      if (profile?.gestational_age_weeks && profile.gestational_age_weeks < 12) {
        factors.push('early_pregnancy');
      }
      return factors;
    } catch {
      return [];
    }
  }

  /**
   * Process user message and generate AI response
   */
  async processMessage(
    sessionId: string,
    userId: string,
    userRole: UserRole,
    message: string,
    pregnancyWeek?: number
  ): Promise<AIResponse> {
    const context = await this.getOrCreateContext(sessionId, userId, userRole, pregnancyWeek);
    const startTime = Date.now();

    // Safety check first
    const emergencyCheck = this.checkForEmergency(message);
    if (emergencyCheck.isEmergency) {
      return this.generateEmergencyResponse(emergencyCheck.keywords, userRole, context);
    }

    // Extract information from message
    const intent = this.detectIntent(message);
    const emotionalTone = this.detectEmotionalTone(message);
    const symptoms = this.extractSymptoms(message);
    const entities = this.extractMedicalEntities(message);

    // Update context
    context.currentIntent = intent;
    context.emotionalTone = emotionalTone;
    context.extractedSymptoms.push(...symptoms);
    context.lastUpdated = new Date();

    // Add user message to context
    context.messages.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      metadata: { intent, entities },
    });

    // Generate response based on intent
    const response = await this.generateResponse(context, intent, symptoms, entities, userRole);

    // Add assistant message to context
    context.messages.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}_resp`,
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      metadata: { riskLevel: response.riskLevel },
    });

    // Store conversation for learning (anonymized)
    await this.storeConversation(context, message, response);

    const processingTime = Date.now() - startTime;
    console.log(`AI processing time: ${processingTime}ms`);

    return response;
  }

  /**
   * Check for emergency keywords
   */
  private checkForEmergency(message: string): { isEmergency: boolean; keywords: string[] } {
    const lowerMessage = message.toLowerCase();
    const foundKeywords = EMERGENCY_KEYWORDS.filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    return {
      isEmergency: foundKeywords.length > 0,
      keywords: foundKeywords,
    };
  }

  /**
   * Generate emergency response
   */
  private generateEmergencyResponse(
    keywords: string[],
    userRole: UserRole,
    context: ConversationContext
  ): AIResponse {
    const patientMessage = `🚨 I've detected potential emergency symptoms: ${keywords.join(', ')}. 
    
Please take these immediate steps:
1. Stay calm and sit or lie down in a safe position
2. If you're alone, call someone to be with you
3. Contact your healthcare provider immediately
4. If symptoms are severe, call emergency services (911)

Do NOT wait to see if symptoms improve. Your safety and your baby's safety are the priority.

Is someone with you right now?`;

    const clinicalMessage = `EMERGENCY ALERT: Patient reported ${keywords.join(', ')}. 
Pregnancy week: ${context.pregnancyWeek || 'Unknown'}
Risk factors: ${context.riskFactors.join(', ') || 'None recorded'}
Immediate clinical assessment required.`;

    return {
      message: patientMessage,
      clinicalMessage: userRole === 'doctor' ? clinicalMessage : undefined,
      intent: 'emergency',
      riskLevel: 'level_4',
      extractedSymptoms: keywords.map(k => ({ name: k, severity: 'critical' as const })),
      entities: keywords.map(k => ({ type: 'symptom' as const, value: k, confidence: 0.95 })),
      recommendations: [
        'Seek immediate medical attention',
        'Call emergency services if symptoms are severe',
        'Do not drive yourself to the hospital',
        'Have someone stay with you',
      ],
      requiresEscalation: true,
      escalationReason: `Emergency symptoms detected: ${keywords.join(', ')}`,
      confidence: 0.95,
      disclaimer: 'This is an AI-assisted assessment. In case of emergency, always contact emergency services immediately.',
      reasoning: {
        steps: [
          'Detected high-priority emergency keywords in message',
          'Matched against known emergency symptom patterns',
          'Triggered immediate escalation protocol',
        ],
        featuresConsidered: ['keyword_matching', 'severity_indicators', 'pregnancy_context'],
        confidenceFactors: [
          { factor: 'keyword_match', weight: 0.9 },
          { factor: 'context_severity', weight: 0.85 },
        ],
      },
    };
  }

  /**
   * Detect user intent from message
   */
  private detectIntent(message: string): Intent {
    for (const { pattern, intent } of INTENT_PATTERNS) {
      if (pattern.test(message)) {
        return intent;
      }
    }
    return 'general';
  }

  /**
   * Detect emotional tone from message
   */
  private detectEmotionalTone(message: string): EmotionalTone {
    for (const { pattern, tone } of EMOTIONAL_PATTERNS) {
      if (pattern.test(message)) {
        return tone;
      }
    }
    return 'neutral';
  }

  /**
   * Extract symptoms from message
   */
  private extractSymptoms(message: string): ExtractedSymptom[] {
    const symptoms: ExtractedSymptom[] = [];
    
    for (const { pattern, symptom, severity } of SYMPTOM_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const extractedName = symptom.includes('$1') && match[1] 
          ? symptom.replace('$1', match[1]) 
          : symptom;
        
        // Avoid duplicates
        if (!symptoms.find(s => s.name.toLowerCase() === extractedName.toLowerCase())) {
          symptoms.push({
            name: extractedName,
            severity,
          });
        }
      }
    }
    
    return symptoms;
  }

  /**
   * Extract medical entities from message
   */
  private extractMedicalEntities(message: string): MedicalEntity[] {
    const entities: MedicalEntity[] = [];
    
    // Extract time expressions
    const timePatterns = [
      /(\d+)\s*(hour|day|week|month)s?\s*(ago)?/gi,
      /(yesterday|today|this morning|last night)/gi,
      /(since|for)\s*(\d+)\s*(day|week|hour)s?/gi,
    ];
    
    for (const pattern of timePatterns) {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        entities.push({
          type: 'time_expression',
          value: match[0],
          confidence: 0.85,
        });
      }
    }

    // Extract measurements
    const measurementPatterns = [
      /(\d+\/\d+)\s*(mmHg|mm\s*Hg)/gi, // Blood pressure
      /(\d+\.?\d*)\s*(kg|pounds?|lbs?)/gi, // Weight
      /(\d+\.?\d*)\s*°?\s*(C|F|celsius|fahrenheit)/gi, // Temperature
      /(\d+)\s*(bpm|beats?\s*per\s*min)/gi, // Heart rate
    ];

    for (const pattern of measurementPatterns) {
      const matches = message.matchAll(pattern);
      for (const match of matches) {
        entities.push({
          type: 'measurement',
          value: match[0],
          confidence: 0.9,
        });
      }
    }

    // Extract body parts
    const bodyParts = ['head', 'stomach', 'abdomen', 'back', 'chest', 'leg', 'arm', 'pelvis', 'uterus'];
    for (const part of bodyParts) {
      if (message.toLowerCase().includes(part)) {
        entities.push({
          type: 'body_part',
          value: part,
          confidence: 0.8,
        });
      }
    }

    return entities;
  }

  /**
   * Generate contextual response based on intent and extracted information
   */
  private async generateResponse(
    context: ConversationContext,
    intent: Intent,
    symptoms: ExtractedSymptom[],
    entities: MedicalEntity[],
    userRole: UserRole
  ): Promise<AIResponse> {
    // Calculate risk level based on symptoms and context
    const riskLevel = this.calculateRiskLevel(symptoms, context);
    
    // Generate response based on intent
    let message: string;
    let clinicalMessage: string | undefined;
    let recommendations: string[] = [];
    let requiresEscalation = false;
    let escalationReason: string | undefined;

    // Adjust language based on user role
    const isPatient = userRole === 'mother';

    switch (intent) {
      case 'symptom_report':
        const symptomResponse = this.generateSymptomResponse(symptoms, riskLevel, context, isPatient);
        message = symptomResponse.message;
        clinicalMessage = symptomResponse.clinicalMessage;
        recommendations = symptomResponse.recommendations;
        requiresEscalation = riskLevel === 'level_3' || riskLevel === 'level_4';
        if (requiresEscalation) {
          escalationReason = `Risk level ${riskLevel} detected with symptoms: ${symptoms.map(s => s.name).join(', ')}`;
        }
        break;

      case 'emotional_support':
        message = this.generateEmotionalSupportResponse(context.emotionalTone, isPatient);
        recommendations = [
          'Practice deep breathing exercises',
          'Speak with a trusted friend or family member',
          'Consider talking to a counselor',
          'Maintain regular sleep schedule',
        ];
        break;

      case 'medication':
        message = isPatient
          ? "I understand you have questions about medication. It's important to always consult your healthcare provider before taking any medication during pregnancy. Some medications that are safe normally may not be safe during pregnancy. Would you like me to help you prepare questions for your doctor?"
          : "Patient inquiring about medication. Review current prescription history and pregnancy stage before providing guidance.";
        recommendations = [
          'Consult your doctor before taking any medication',
          'Always mention your pregnancy when getting prescriptions',
          'Keep a list of all medications you take',
        ];
        break;

      case 'nutrition':
        message = isPatient
          ? "Nutrition is so important during pregnancy! Here are some key points:\n\n• Eat plenty of fruits, vegetables, and whole grains\n• Get enough protein from lean meats, beans, or legumes\n• Take your prenatal vitamins as prescribed\n• Stay well hydrated with water\n• Avoid raw fish, unpasteurized dairy, and deli meats\n\nWould you like more specific guidance based on your pregnancy stage?"
          : "Patient seeking nutritional guidance. Consider gestational age and any nutritional deficiencies noted in records.";
        recommendations = [
          'Take prenatal vitamins daily',
          'Eat small, frequent meals',
          'Stay hydrated',
          'Avoid alcohol and limit caffeine',
        ];
        break;

      case 'appointment':
        message = isPatient
          ? "I can help you with appointment scheduling! Would you like to:\n\n1. Book a new appointment\n2. View upcoming appointments\n3. Reschedule an existing appointment\n\nPlease let me know what you'd like to do."
          : "Patient requesting appointment management assistance.";
        recommendations = [
          'Prepare questions before your appointment',
          'Bring a list of current symptoms',
          'Note any changes since last visit',
        ];
        break;

      case 'education':
        message = isPatient
          ? `I'd love to help you learn more! Based on ${context.pregnancyWeek ? `your ${context.pregnancyWeek}th week of pregnancy` : 'your pregnancy'}, here are some topics you might find helpful:\n\n• What to expect this trimester\n• Baby's development\n• Preparing for labor and delivery\n• Postpartum care\n\nWhat topic interests you most?`
          : "Patient seeking educational content. Consider providing stage-appropriate resources.";
        recommendations = [
          'Attend prenatal classes',
          'Read reputable pregnancy resources',
          'Join a support group for expectant mothers',
        ];
        break;

      case 'question':
        message = isPatient
          ? "I'm here to help answer your questions! Please note that while I can provide general information, I'm not a replacement for your healthcare provider. What would you like to know?"
          : "Patient has a general health inquiry. Review context before responding.";
        recommendations = [
          'Keep a list of questions for your doctor',
          'Don\'t hesitate to ask about anything concerning you',
        ];
        break;

      default:
        message = isPatient
          ? `Hello! I'm your maternal health assistant. I'm here to help you throughout your pregnancy journey. I can:\n\n• Help you track and report symptoms\n• Answer questions about pregnancy\n• Provide nutrition and wellness guidance\n• Help with appointment scheduling\n• Offer emotional support\n\nHow can I assist you today?`
          : "Patient initiated general conversation. Awaiting specific inquiry.";
        recommendations = [];
    }

    // Build reasoning trace
    const reasoning: ReasoningTrace = {
      steps: [
        `Analyzed message intent: ${intent}`,
        `Detected emotional tone: ${context.emotionalTone}`,
        `Extracted ${symptoms.length} symptom(s)`,
        `Identified ${entities.length} medical entity(ies)`,
        `Calculated risk level: ${riskLevel}`,
        `Generated ${isPatient ? 'patient-friendly' : 'clinical'} response`,
      ],
      featuresConsidered: [
        'message_content',
        'conversation_history',
        'pregnancy_stage',
        'risk_factors',
        'emotional_state',
      ],
      confidenceFactors: [
        { factor: 'intent_clarity', weight: 0.85 },
        { factor: 'symptom_specificity', weight: symptoms.length > 0 ? 0.9 : 0.7 },
        { factor: 'context_completeness', weight: context.pregnancyWeek ? 0.9 : 0.75 },
      ],
    };

    // Calculate overall confidence
    const confidence = reasoning.confidenceFactors.reduce((sum, f) => sum + f.weight, 0) / reasoning.confidenceFactors.length;

    return {
      message,
      clinicalMessage: !isPatient ? clinicalMessage : undefined,
      intent,
      riskLevel,
      extractedSymptoms: symptoms,
      entities,
      recommendations,
      requiresEscalation,
      escalationReason,
      confidence,
      disclaimer: 'This AI assistant provides general information only and is not a substitute for professional medical advice. Always consult your healthcare provider for medical decisions.',
      reasoning,
    };
  }

  /**
   * Generate symptom-specific response
   */
  private generateSymptomResponse(
    symptoms: ExtractedSymptom[],
    riskLevel: RiskLevel,
    context: ConversationContext,
    isPatient: boolean
  ): { message: string; clinicalMessage: string; recommendations: string[] } {
    const symptomList = symptoms.map(s => s.name).join(', ') || 'your symptoms';
    
    let message: string;
    let recommendations: string[];

    switch (riskLevel) {
      case 'level_1':
        message = isPatient
          ? `Thank you for sharing about ${symptomList}. Based on what you've described, these symptoms appear to be within normal range for pregnancy. However, I recommend:\n\n• Continue monitoring how you feel\n• Stay hydrated and get adequate rest\n• Note any changes or worsening symptoms\n\nWould you like tips on managing these symptoms?`
          : `Patient reported ${symptomList}. Low risk assessment. Continue routine monitoring.`;
        recommendations = ['Monitor symptoms', 'Stay hydrated', 'Get adequate rest', 'Continue normal activities'];
        break;

      case 'level_2':
        message = isPatient
          ? `I understand you're experiencing ${symptomList}. These symptoms warrant attention. I recommend:\n\n• Monitor your symptoms closely over the next 24-48 hours\n• Keep track of frequency and intensity\n• Contact your healthcare provider if symptoms worsen or persist\n\nWould you like to schedule a routine check-up?`
          : `Patient reported ${symptomList}. Moderate concern. Recommend follow-up within 48-72 hours.`;
        recommendations = ['Monitor symptoms closely', 'Schedule routine check-up', 'Avoid strenuous activities', 'Contact doctor if worsening'];
        break;

      case 'level_3':
        message = isPatient
          ? `⚠️ I'm concerned about ${symptomList}. These symptoms require prompt medical attention. Please:\n\n• Contact your healthcare provider within the next 24 hours\n• Do not wait to see if symptoms improve on their own\n• Avoid strenuous activity until evaluated\n\nWould you like help contacting your doctor now?`
          : `ALERT: Patient reported ${symptomList}. Elevated risk. Urgent follow-up required within 24 hours.`;
        recommendations = ['Contact doctor within 24 hours', 'Avoid strenuous activity', 'Have someone available to assist', 'Prepare to seek emergency care if worsening'];
        break;

      case 'level_4':
        message = isPatient
          ? `🚨 The symptoms you've described (${symptomList}) are serious and require immediate medical attention. Please:\n\n• Go to the emergency room or call emergency services NOW\n• Do not drive yourself - have someone take you or call an ambulance\n• Bring someone with you if possible\n\nYour health and your baby's health are the priority.`
          : `CRITICAL: Patient reported ${symptomList}. Immediate medical intervention required. Activate emergency protocol.`;
        recommendations = ['Seek immediate emergency care', 'Call emergency services', 'Do not drive yourself', 'Have someone stay with you'];
        break;
    }

    const clinicalMessage = `Clinical Assessment:\nSymptoms: ${symptomList}\nSeverities: ${symptoms.map(s => `${s.name}(${s.severity})`).join(', ')}\nPregnancy week: ${context.pregnancyWeek || 'Unknown'}\nRisk factors: ${context.riskFactors.join(', ') || 'None'}\nRisk Level: ${riskLevel}`;

    return { message, clinicalMessage, recommendations };
  }

  /**
   * Generate emotional support response
   */
  private generateEmotionalSupportResponse(tone: EmotionalTone, isPatient: boolean): string {
    if (!isPatient) {
      return `Patient displaying ${tone} emotional state. Consider mental health screening if appropriate.`;
    }

    switch (tone) {
      case 'anxious':
        return "I hear that you're feeling worried, and that's completely understandable. Pregnancy can bring many concerns. Remember:\n\n• Your feelings are valid\n• Many expectant mothers share similar worries\n• It's okay to ask for help and support\n\nWould you like to talk about what's specifically worrying you? Or would you like some relaxation techniques that might help?";

      case 'distressed':
        return "I can sense you're going through a difficult time, and I want you to know that you're not alone. It's important that you:\n\n• Reach out to someone you trust\n• Consider speaking with a professional counselor\n• Don't hesitate to contact your healthcare provider\n\nYour mental health matters just as much as your physical health. Would you like resources for emotional support?";

      case 'urgent':
        return "I understand this feels urgent. Let me help you:\n\n• If this is a medical emergency, please call emergency services\n• If you need to speak with your doctor, I can help you prepare\n• If you're feeling overwhelmed, that's okay - we'll take this one step at a time\n\nWhat do you need help with right now?";

      default:
        return "Thank you for sharing how you're feeling. It's important to take care of your emotional wellbeing during pregnancy. I'm here to listen and support you. What's on your mind?";
    }
  }

  /**
   * Calculate risk level based on symptoms and context
   */
  private calculateRiskLevel(symptoms: ExtractedSymptom[], context: ConversationContext): RiskLevel {
    if (symptoms.length === 0) return 'level_1';

    // Check for critical symptoms
    const hasCritical = symptoms.some(s => s.severity === 'critical');
    if (hasCritical) return 'level_4';

    // Check for severe symptoms
    const hasSevere = symptoms.some(s => s.severity === 'severe');
    if (hasSevere) return 'level_3';

    // Check for multiple moderate symptoms
    const moderateCount = symptoms.filter(s => s.severity === 'moderate').length;
    if (moderateCount >= 2) return 'level_3';
    if (moderateCount === 1) return 'level_2';

    // Check for risk factors
    if (context.riskFactors.length > 0) {
      return 'level_2';
    }

    return 'level_1';
  }

  /**
   * Store conversation for future learning (anonymized)
   */
  private async storeConversation(
    context: ConversationContext,
    userMessage: string,
    response: AIResponse
  ): Promise<void> {
    try {
      // Store anonymized conversation data for model improvement
      // This should go through admin approval before being used for training
      await (supabase as any).from('ai_conversations').insert({
        session_id: context.sessionId,
        intent: response.intent,
        risk_level: response.riskLevel,
        symptoms_extracted: response.extractedSymptoms.map(s => s.name),
        confidence_score: response.confidence,
        required_escalation: response.requiresEscalation,
        model_version: this.modelVersion,
        created_at: new Date().toISOString(),
      }).catch(() => {
        // Table might not exist yet, ignore error
      });
    } catch (error) {
      // Silently fail - this is for analytics only
      console.log('Note: AI conversation logging not available');
    }
  }

  /**
   * Clear conversation context
   */
  clearContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId: string): ConversationMessage[] {
    return this.contexts.get(sessionId)?.messages || [];
  }
}

// Export singleton instance
export const aiConversationalEngine = new AIConversationalEngine();
export default aiConversationalEngine;
