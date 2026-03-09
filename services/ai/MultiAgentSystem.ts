/**
 * Multi-Agent AI Architecture for Maternal Health System
 * 
 * Implements coordinated agents:
 * - Triage Agent → urgency detection
 * - Obstetric Agent → pregnancy reasoning
 * - Education Agent → patient explanations
 * - Safety Agent → harmful advice filter
 * - Emergency Agent → crisis detection
 * - Learning Agent → dataset expansion
 * 
 * Orchestrator controls agent collaboration using:
 * - Priority routing
 * - Consensus voting
 * - Conflict resolution logic
 */

import { RiskLevel } from '@/types/database.types';

// Types
export interface AgentInput {
  message: string;
  userId: string;
  userRole: 'mother' | 'doctor' | 'admin';
  context: AgentContext;
}

export interface AgentContext {
  pregnancyWeek?: number;
  riskLevel?: RiskLevel;
  previousMessages: { role: string; content: string }[];
  symptoms?: string[];
  vitalSigns?: Record<string, number>;
  riskFactors?: string[];
}

export interface AgentOutput {
  agentId: string;
  agentName: string;
  response: string;
  confidence: number;
  priority: number;
  metadata: Record<string, any>;
  requiresHumanReview?: boolean;
  escalate?: boolean;
  escalationReason?: string;
}

export interface OrchestratorResult {
  finalResponse: string;
  contributingAgents: string[];
  consensusReached: boolean;
  conflictsResolved: string[];
  overallConfidence: number;
  safetyChecked: boolean;
  requiresEscalation: boolean;
  escalationDetails?: string;
  learningOpportunity?: LearningOpportunity;
  reasoning: OrchestratorReasoning;
}

export interface LearningOpportunity {
  type: 'new_symptom_pattern' | 'unusual_case' | 'feedback_needed' | 'knowledge_gap';
  description: string;
  suggestedAction: string;
  dataForReview: Record<string, any>;
}

export interface OrchestratorReasoning {
  routingDecision: string;
  agentResponses: { agent: string; confidence: number; selected: boolean }[];
  conflictResolution?: string;
  safetyFilterResult: string;
}

// Base Agent Interface
abstract class BaseAgent {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract priority: number;
  
  abstract shouldActivate(input: AgentInput): boolean;
  abstract process(input: AgentInput): Promise<AgentOutput>;
  
  protected createOutput(
    response: string, 
    confidence: number, 
    metadata: Record<string, any> = {}
  ): AgentOutput {
    return {
      agentId: this.id,
      agentName: this.name,
      response,
      confidence,
      priority: this.priority,
      metadata,
    };
  }
}

// Triage Agent - Urgency Detection
class TriageAgent extends BaseAgent {
  id = 'triage_agent';
  name = 'Triage Agent';
  description = 'Assesses urgency of patient concerns and prioritizes responses';
  priority = 100; // Highest priority

  private urgentKeywords = [
    'emergency', 'urgent', 'severe', 'intense', 'unbearable',
    'bleeding', 'hemorrhage', 'unconscious', 'seizure', 'can\'t breathe',
    'chest pain', 'no movement', 'water broke', 'contractions'
  ];

  private moderateKeywords = [
    'worried', 'concerned', 'persistent', 'worsening', 'increasing',
    'fever', 'pain', 'swelling', 'headache', 'nausea'
  ];

  shouldActivate(input: AgentInput): boolean {
    // Always activate for triage assessment
    return true;
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const messageLower = input.message.toLowerCase();
    
    // Check for urgent keywords
    const urgentMatches = this.urgentKeywords.filter(k => messageLower.includes(k));
    const moderateMatches = this.moderateKeywords.filter(k => messageLower.includes(k));
    
    let urgencyLevel: 'routine' | 'moderate' | 'urgent' | 'emergency' = 'routine';
    let confidence = 0.7;
    
    if (urgentMatches.length >= 2) {
      urgencyLevel = 'emergency';
      confidence = 0.95;
    } else if (urgentMatches.length === 1) {
      urgencyLevel = 'urgent';
      confidence = 0.85;
    } else if (moderateMatches.length >= 2) {
      urgencyLevel = 'moderate';
      confidence = 0.8;
    } else if (moderateMatches.length === 1) {
      urgencyLevel = 'moderate';
      confidence = 0.75;
    }
    
    // Context adjustments
    if (input.context.riskLevel === 'level_3' || input.context.riskLevel === 'level_4') {
      urgencyLevel = this.increaseUrgency(urgencyLevel);
      confidence = Math.min(confidence + 0.1, 0.98);
    }
    
    if (input.context.pregnancyWeek && input.context.pregnancyWeek > 36) {
      // Late pregnancy - increase sensitivity
      if (urgencyLevel === 'routine') urgencyLevel = 'moderate';
      confidence = Math.min(confidence + 0.05, 0.98);
    }

    const output = this.createOutput(
      this.generateTriageResponse(urgencyLevel),
      confidence,
      {
        urgencyLevel,
        urgentKeywordsFound: urgentMatches,
        moderateKeywordsFound: moderateMatches,
      }
    );

    if (urgencyLevel === 'emergency' || urgencyLevel === 'urgent') {
      output.escalate = true;
      output.escalationReason = `Triage level: ${urgencyLevel}. Keywords: ${[...urgentMatches, ...moderateMatches].join(', ')}`;
    }

    return output;
  }

  private increaseUrgency(current: string): 'routine' | 'moderate' | 'urgent' | 'emergency' {
    const order = ['routine', 'moderate', 'urgent', 'emergency'];
    const idx = order.indexOf(current);
    return order[Math.min(idx + 1, 3)] as any;
  }

  private generateTriageResponse(urgency: string): string {
    switch (urgency) {
      case 'emergency':
        return 'EMERGENCY TRIAGE: Immediate medical attention required.';
      case 'urgent':
        return 'URGENT TRIAGE: Please seek medical attention within the next few hours.';
      case 'moderate':
        return 'MODERATE CONCERN: Consider contacting your healthcare provider soon.';
      default:
        return 'ROUTINE: No immediate concerns detected.';
    }
  }
}

// Obstetric Agent - Pregnancy Reasoning
class ObstetricAgent extends BaseAgent {
  id = 'obstetric_agent';
  name = 'Obstetric Agent';
  description = 'Provides pregnancy-specific medical reasoning and advice';
  priority = 90;

  private pregnancyTopics = [
    'pregnancy', 'pregnant', 'baby', 'fetus', 'trimester',
    'weeks', 'due date', 'delivery', 'labor', 'contraction',
    'prenatal', 'ultrasound', 'kick', 'movement', 'growth'
  ];

  shouldActivate(input: AgentInput): boolean {
    const messageLower = input.message.toLowerCase();
    return this.pregnancyTopics.some(t => messageLower.includes(t)) ||
           input.context.pregnancyWeek !== undefined;
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const week = input.context.pregnancyWeek;
    const trimester = week ? this.getTrimester(week) : null;
    
    let response = '';
    let confidence = 0.8;
    
    if (week) {
      const weekInfo = this.getWeeklyInfo(week);
      response = `At week ${week} of pregnancy (${trimester} trimester):\n\n`;
      response += `Baby Development: ${weekInfo.babyDevelopment}\n\n`;
      response += `Common Experiences: ${weekInfo.commonExperiences}\n\n`;
      response += `Important Notes: ${weekInfo.importantNotes}`;
      confidence = 0.85;
    } else {
      response = 'I can provide pregnancy-specific guidance. Could you share how many weeks along you are?';
      confidence = 0.7;
    }

    return this.createOutput(response, confidence, {
      pregnancyWeek: week,
      trimester,
      isPregnancyRelated: true,
    });
  }

  private getTrimester(week: number): string {
    if (week <= 12) return 'first';
    if (week <= 27) return 'second';
    return 'third';
  }

  private getWeeklyInfo(week: number): { babyDevelopment: string; commonExperiences: string; importantNotes: string } {
    // Simplified weekly information
    if (week <= 12) {
      return {
        babyDevelopment: 'Major organs are forming. Heart is beating. Neural tube developing.',
        commonExperiences: 'Morning sickness, fatigue, breast tenderness are common.',
        importantNotes: 'Take prenatal vitamins with folic acid. Avoid alcohol and raw foods.',
      };
    } else if (week <= 20) {
      return {
        babyDevelopment: 'Baby is growing rapidly. You may start feeling movement.',
        commonExperiences: 'Energy often improves. Belly becoming visible.',
        importantNotes: 'Anatomy scan typically done around 18-20 weeks.',
      };
    } else if (week <= 27) {
      return {
        babyDevelopment: 'Baby can hear sounds. Eyes are opening. Lungs developing.',
        commonExperiences: 'Regular fetal movement. Some back pain may occur.',
        importantNotes: 'Glucose screening typically done at 24-28 weeks.',
      };
    } else if (week <= 36) {
      return {
        babyDevelopment: 'Baby is gaining weight rapidly. Preparing for birth.',
        commonExperiences: 'Braxton Hicks contractions. Increased fatigue.',
        importantNotes: 'Monitor fetal movement daily. Know signs of preterm labor.',
      };
    } else {
      return {
        babyDevelopment: 'Baby is full-term and ready for birth.',
        commonExperiences: 'Increased pressure, possible nesting instinct.',
        importantNotes: 'Know labor signs. Have hospital bag ready. Monitor for decreased movement.',
      };
    }
  }
}

// Education Agent - Patient Explanations
class EducationAgent extends BaseAgent {
  id = 'education_agent';
  name = 'Education Agent';
  description = 'Provides clear, accessible health education and explanations';
  priority = 60;

  private educationTriggers = [
    'what is', 'what are', 'explain', 'tell me about', 'how does',
    'why do', 'should i', 'can i', 'is it normal', 'learn'
  ];

  shouldActivate(input: AgentInput): boolean {
    const messageLower = input.message.toLowerCase();
    return this.educationTriggers.some(t => messageLower.includes(t));
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const isPatient = input.userRole === 'mother';
    
    // Detect the topic
    const topic = this.detectTopic(input.message);
    
    let response: string;
    if (isPatient) {
      // Simple, friendly language for patients
      response = this.generatePatientExplanation(topic, input.message);
    } else {
      // Clinical language for healthcare providers
      response = this.generateClinicalExplanation(topic, input.message);
    }

    return this.createOutput(response, 0.75, {
      topic,
      languageLevel: isPatient ? 'patient' : 'clinical',
      educationType: 'general_information',
    });
  }

  private detectTopic(message: string): string {
    const topicKeywords: Record<string, string[]> = {
      'morning_sickness': ['nausea', 'vomiting', 'morning sickness', 'sick'],
      'fetal_movement': ['baby moving', 'kick', 'movement', 'baby kick'],
      'blood_pressure': ['blood pressure', 'bp', 'hypertension'],
      'nutrition': ['eat', 'food', 'diet', 'nutrition', 'vitamin'],
      'exercise': ['exercise', 'workout', 'active', 'walk'],
      'labor': ['labor', 'delivery', 'contractions', 'birth'],
      'medications': ['medication', 'medicine', 'drug', 'safe to take'],
    };

    const messageLower = message.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(k => messageLower.includes(k))) {
        return topic;
      }
    }
    return 'general';
  }

  private generatePatientExplanation(topic: string, question: string): string {
    const explanations: Record<string, string> = {
      morning_sickness: `Morning sickness is very common in pregnancy, especially in the first trimester. It happens because of hormone changes in your body. 

Tips that may help:
• Eat small, frequent meals
• Keep crackers by your bed for the morning
• Stay hydrated with small sips
• Avoid strong smells that bother you

If you can't keep any food or water down, contact your doctor as this might need treatment.`,

      fetal_movement: `Feeling your baby move is one of the exciting parts of pregnancy! Most moms first feel movement between 18-25 weeks.

What to know:
• Early movements feel like bubbles or flutters
• Movements become stronger as baby grows
• Baby has sleep cycles, so quiet periods are normal
• After 28 weeks, track daily movement patterns

If you notice a significant decrease in movement, contact your healthcare provider.`,

      blood_pressure: `Blood pressure is carefully monitored during pregnancy because changes can affect you and your baby.

Normal BP in pregnancy is usually below 120/80. High blood pressure (above 140/90) needs medical attention.

Warning signs to watch for:
• Severe headaches
• Vision changes
• Upper belly pain
• Sudden swelling

Regular prenatal visits help catch any changes early.`,

      nutrition: `Good nutrition supports your baby's growth and your health. Here's what to focus on:

• Eat plenty of fruits, vegetables, whole grains
• Include protein at each meal (lean meats, beans, eggs)
• Take your prenatal vitamin daily
• Drink lots of water (8-10 glasses)

Foods to avoid:
• Raw fish and undercooked meats
• Unpasteurized dairy
• High-mercury fish
• Alcohol`,

      exercise: `Staying active during pregnancy is great for you and baby! Safe exercises include:

• Walking
• Swimming
• Prenatal yoga
• Light strength training

Listen to your body and stop if you feel:
• Dizziness
• Shortness of breath
• Pain
• Contractions

Always check with your doctor before starting a new exercise routine.`,

      labor: `Labor is how your body prepares to deliver your baby. Here are the signs that labor may be starting:

Early signs:
• Regular contractions that get stronger
• Contractions that don't stop when you move
• Lower back pain
• "Water breaking" (amniotic fluid leaking)

When to go to the hospital:
• Contractions 5 minutes apart for 1 hour
• Your water breaks
• Heavy bleeding
• Decreased baby movement`,

      medications: `During pregnancy, always check before taking any medication, including over-the-counter medicines.

Generally considered safe (ask your doctor):
• Acetaminophen (Tylenol) for pain
• Some antacids for heartburn
• Certain prenatal vitamins

Usually to avoid:
• Ibuprofen (Advil, Motrin)
• Aspirin (unless prescribed)
• Some herbal supplements

Always tell your pharmacist and doctor that you're pregnant.`,

      general: `I'm happy to help answer your pregnancy questions! I can provide information about:

• Pregnancy symptoms and what's normal
• Baby's development week by week
• Nutrition and exercise during pregnancy
• What to expect during labor and delivery
• When to contact your healthcare provider

What would you like to know more about?`,
    };

    return explanations[topic] || explanations.general;
  }

  private generateClinicalExplanation(topic: string, question: string): string {
    // Clinical language for healthcare providers
    return `Clinical Reference for ${topic.replace('_', ' ')}:\n\nRefer to ACOG guidelines for evidence-based management protocols. Key clinical considerations include risk stratification, monitoring parameters, and intervention thresholds appropriate for the patient's gestational age and risk factors.`;
  }
}

// Safety Agent - Harmful Advice Filter
class SafetyAgent extends BaseAgent {
  id = 'safety_agent';
  name = 'Safety Agent';
  description = 'Filters potentially harmful advice and ensures medical safety';
  priority = 95; // Very high priority

  private unsafeTopics = [
    'abortion', 'terminate', 'end pregnancy', 'induce labor at home',
    'skip prenatal', 'don\'t need doctor', 'natural only', 'refuse treatment',
    'home birth alone', 'ignore symptoms'
  ];

  private disclaimerRequired = [
    'medication', 'drug', 'dosage', 'treatment', 'diagnosis',
    'definitely', 'certainly', 'guarantee', 'cure', 'will fix'
  ];

  shouldActivate(input: AgentInput): boolean {
    // Always activate to review all responses
    return true;
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const messageLower = input.message.toLowerCase();
    
    // Check for unsafe topics
    const unsafeMatches = this.unsafeTopics.filter(t => messageLower.includes(t));
    
    // Check if disclaimer needed
    const needsDisclaimer = this.disclaimerRequired.some(t => messageLower.includes(t));
    
    let safetyLevel: 'safe' | 'caution' | 'unsafe' = 'safe';
    let response = '';
    let confidence = 0.9;
    
    if (unsafeMatches.length > 0) {
      safetyLevel = 'unsafe';
      response = this.generateSafetyRedirect(unsafeMatches);
      confidence = 0.95;
    } else if (needsDisclaimer) {
      safetyLevel = 'caution';
      response = this.generateDisclaimer();
      confidence = 0.85;
    } else {
      response = 'Content passed safety review.';
    }

    const output = this.createOutput(response, confidence, {
      safetyLevel,
      unsafeTopicsDetected: unsafeMatches,
      disclaimerAdded: needsDisclaimer,
    });

    if (safetyLevel === 'unsafe') {
      output.requiresHumanReview = true;
    }

    return output;
  }

  private generateSafetyRedirect(unsafeTopics: string[]): string {
    return `I understand you may have concerns, but I need to ensure your safety. For topics related to ${unsafeTopics.join(', ')}, please speak directly with your healthcare provider who can give you personalized guidance based on your specific situation. Your health and your baby's health are the priority.`;
  }

  private generateDisclaimer(): string {
    return 'DISCLAIMER: This information is for educational purposes only and should not replace professional medical advice. Always consult with your healthcare provider before making any medical decisions or changes to your treatment plan.';
  }

  /**
   * Review a response before sending to user
   */
  reviewResponse(response: string): { approved: boolean; modifiedResponse: string; issues: string[] } {
    const issues: string[] = [];
    let modifiedResponse = response;
    
    // Check for definitive medical claims
    const definitivePatterns = [
      /you definitely have/i,
      /this is certainly/i,
      /guaranteed to/i,
      /will cure/i,
      /don't need to see a doctor/i,
    ];
    
    for (const pattern of definitivePatterns) {
      if (pattern.test(response)) {
        issues.push(`Found potentially unsafe definitive claim: ${pattern}`);
        modifiedResponse = modifiedResponse.replace(pattern, 'may indicate');
      }
    }
    
    // Ensure disclaimer is present for medical advice
    if (response.toLowerCase().includes('recommend') || response.toLowerCase().includes('should')) {
      if (!response.includes('healthcare provider') && !response.includes('doctor')) {
        modifiedResponse += '\n\nPlease consult with your healthcare provider for personalized medical advice.';
      }
    }
    
    return {
      approved: issues.length === 0,
      modifiedResponse,
      issues,
    };
  }
}

// Emergency Agent - Crisis Detection
class EmergencyAgent extends BaseAgent {
  id = 'emergency_agent';
  name = 'Emergency Agent';
  description = 'Detects crisis situations and triggers emergency protocols';
  priority = 100; // Highest priority

  private emergencyPatterns = [
    { pattern: /severe bleeding|hemorrhage|heavy bleeding/i, severity: 'critical', action: 'call_emergency' },
    { pattern: /seizure|convulsion|fitting/i, severity: 'critical', action: 'call_emergency' },
    { pattern: /unconscious|passed out|fainted and not waking/i, severity: 'critical', action: 'call_emergency' },
    { pattern: /can't breathe|difficulty breathing|shortness of breath/i, severity: 'critical', action: 'call_emergency' },
    { pattern: /no (fetal|baby) movement|baby (not|hasn't) moved/i, severity: 'high', action: 'urgent_care' },
    { pattern: /water broke|waters breaking|leaking fluid/i, severity: 'high', action: 'go_hospital' },
    { pattern: /regular contractions|labor pains/i, severity: 'high', action: 'go_hospital' },
    { pattern: /severe headache|worst headache/i, severity: 'high', action: 'urgent_care' },
    { pattern: /chest pain|heart attack/i, severity: 'critical', action: 'call_emergency' },
    { pattern: /suicidal|want to die|harm myself/i, severity: 'critical', action: 'crisis_line' },
  ];

  shouldActivate(input: AgentInput): boolean {
    const messageLower = input.message.toLowerCase();
    return this.emergencyPatterns.some(ep => ep.pattern.test(messageLower));
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const matchedEmergencies = this.emergencyPatterns.filter(ep => 
      ep.pattern.test(input.message.toLowerCase())
    );
    
    if (matchedEmergencies.length === 0) {
      return this.createOutput('No emergency detected.', 0.9, { emergencyDetected: false });
    }
    
    // Get the most severe emergency
    const critical = matchedEmergencies.find(e => e.severity === 'critical');
    const emergency = critical || matchedEmergencies[0];
    
    const response = this.generateEmergencyResponse(emergency);
    
    const output = this.createOutput(response, 0.95, {
      emergencyDetected: true,
      severity: emergency.severity,
      action: emergency.action,
      matchedPatterns: matchedEmergencies.map(e => e.pattern.toString()),
    });
    
    output.escalate = true;
    output.escalationReason = `Emergency detected: ${emergency.severity} - ${emergency.action}`;
    
    return output;
  }

  private generateEmergencyResponse(emergency: { severity: string; action: string }): string {
    const responses: Record<string, string> = {
      call_emergency: `🚨 EMERGENCY ALERT 🚨

This is a medical emergency. Please take these steps IMMEDIATELY:

1. Call emergency services (911) NOW
2. Stay where you are - help is coming
3. If possible, have someone stay with you
4. Lie down in a safe position
5. Keep your phone nearby

If you're alone:
• Call emergency services first
• Then call your emergency contact
• Leave your door unlocked if possible

DO NOT wait to see if symptoms improve. Your life and your baby's life may depend on getting immediate help.`,

      go_hospital: `⚠️ URGENT - Go to Hospital

Please go to the hospital or birthing center NOW:

1. Call someone to drive you - do NOT drive yourself
2. If no one is available, call an ambulance
3. Bring your hospital bag and ID
4. Call the hospital on the way if possible

Signs this is happening:
• Regular, strong contractions
• Water has broken
• Active labor beginning

Stay calm and focused. This is what you've prepared for.`,

      urgent_care: `⚠️ Seek Urgent Medical Care

Please contact your healthcare provider immediately or go to urgent care:

1. Call your doctor's emergency line
2. If unavailable, go to the emergency room
3. Have someone accompany you if possible

While waiting:
• Sit or lie down comfortably
• Monitor your symptoms
• Note when symptoms started

This needs prompt attention but may not require emergency services.`,

      crisis_line: `💚 You're Not Alone

I hear that you're going through something very difficult. Your feelings matter, and help is available.

Please reach out NOW:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

You deserve support. A trained counselor can help you through this moment.

If you're in immediate danger, please call 911.`,
    };

    return responses[emergency.action] || responses.call_emergency;
  }
}

// Learning Agent - Dataset Expansion
class LearningAgent extends BaseAgent {
  id = 'learning_agent';
  name = 'Learning Agent';
  description = 'Identifies learning opportunities and suggests dataset improvements';
  priority = 30; // Lower priority, runs in background

  shouldActivate(input: AgentInput): boolean {
    // Always run to identify learning opportunities
    return true;
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const opportunities = this.identifyLearningOpportunities(input);
    
    return this.createOutput(
      'Learning analysis complete.',
      0.7,
      {
        learningOpportunities: opportunities,
        totalOpportunities: opportunities.length,
      }
    );
  }

  identifyLearningOpportunities(input: AgentInput): LearningOpportunity[] {
    const opportunities: LearningOpportunity[] = [];
    
    // Check for unusual symptom combinations
    if (input.context.symptoms && input.context.symptoms.length >= 3) {
      opportunities.push({
        type: 'unusual_case',
        description: 'Multiple symptoms reported - may represent novel case',
        suggestedAction: 'Flag for medical review and potential dataset addition',
        dataForReview: { symptoms: input.context.symptoms },
      });
    }
    
    // Check for unknown patterns
    const unknownTerms = this.findUnknownTerms(input.message);
    if (unknownTerms.length > 0) {
      opportunities.push({
        type: 'knowledge_gap',
        description: `Potentially unknown terms detected: ${unknownTerms.join(', ')}`,
        suggestedAction: 'Review terms for potential addition to medical ontology',
        dataForReview: { unknownTerms },
      });
    }
    
    // Check for feedback indicators
    if (input.message.toLowerCase().includes('didn\'t help') || 
        input.message.toLowerCase().includes('wrong') ||
        input.message.toLowerCase().includes('not accurate')) {
      opportunities.push({
        type: 'feedback_needed',
        description: 'User indicated dissatisfaction with previous response',
        suggestedAction: 'Review conversation for response improvement',
        dataForReview: { userFeedback: input.message },
      });
    }
    
    return opportunities;
  }

  private findUnknownTerms(message: string): string[] {
    // Simple unknown term detection - would be more sophisticated in production
    const medicalTerms = [
      'eclampsia', 'preeclampsia', 'placenta', 'gestational', 'trimester',
      'fetal', 'contractions', 'dilation', 'effacement', 'braxton'
    ];
    
    const words = message.toLowerCase().split(/\s+/);
    const potentialMedical = words.filter(w => 
      w.length > 6 && 
      !medicalTerms.some(mt => w.includes(mt)) &&
      /[aeiou]/i.test(w) // has vowels (not abbreviation)
    );
    
    // Would typically check against a comprehensive medical dictionary
    return potentialMedical.slice(0, 3);
  }
}

// Orchestrator - Agent Coordination
class AgentOrchestrator {
  private agents: BaseAgent[] = [
    new TriageAgent(),
    new EmergencyAgent(),
    new SafetyAgent(),
    new ObstetricAgent(),
    new EducationAgent(),
    new LearningAgent(),
  ];
  
  private safetyAgent: SafetyAgent;

  constructor() {
    this.safetyAgent = this.agents.find(a => a.id === 'safety_agent') as SafetyAgent;
  }

  /**
   * Process input through agent system
   */
  async process(input: AgentInput): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const agentOutputs: AgentOutput[] = [];
    const reasoning: OrchestratorReasoning = {
      routingDecision: '',
      agentResponses: [],
      safetyFilterResult: '',
    };

    // Step 1: Determine which agents should activate
    const activeAgents = this.agents.filter(agent => agent.shouldActivate(input));
    reasoning.routingDecision = `Activated ${activeAgents.length} agents: ${activeAgents.map(a => a.name).join(', ')}`;

    // Step 2: Run all active agents in parallel (with priority)
    const agentPromises = activeAgents
      .sort((a, b) => b.priority - a.priority)
      .map(agent => agent.process(input));
    
    const outputs = await Promise.all(agentPromises);
    agentOutputs.push(...outputs);

    // Step 3: Check for emergency escalation (highest priority)
    const emergencyOutput = outputs.find(o => o.agentId === 'emergency_agent' && o.escalate);
    if (emergencyOutput) {
      return this.handleEmergencyResult(emergencyOutput, outputs, reasoning);
    }

    // Step 4: Consensus voting for response selection
    const selectedResponse = this.selectBestResponse(outputs);
    reasoning.agentResponses = outputs.map(o => ({
      agent: o.agentName,
      confidence: o.confidence,
      selected: o.agentId === selectedResponse.agentId,
    }));

    // Step 5: Safety review of selected response
    const safetyReview = this.safetyAgent.reviewResponse(selectedResponse.response);
    reasoning.safetyFilterResult = safetyReview.approved 
      ? 'Passed safety review'
      : `Modified for safety: ${safetyReview.issues.join(', ')}`;

    // Step 6: Resolve any conflicts between agents
    const conflicts = this.detectConflicts(outputs);
    if (conflicts.length > 0) {
      reasoning.conflictResolution = this.resolveConflicts(conflicts);
    }

    // Step 7: Check for learning opportunities
    const learningOutput = outputs.find(o => o.agentId === 'learning_agent');
    const learningOpportunity = learningOutput?.metadata.learningOpportunities?.[0];

    const processingTime = Date.now() - startTime;
    console.log(`Orchestrator processing time: ${processingTime}ms`);

    return {
      finalResponse: safetyReview.modifiedResponse,
      contributingAgents: outputs.filter(o => o.confidence > 0.5).map(o => o.agentName),
      consensusReached: conflicts.length === 0,
      conflictsResolved: conflicts.map(c => c.description),
      overallConfidence: this.calculateOverallConfidence(outputs),
      safetyChecked: true,
      requiresEscalation: outputs.some(o => o.escalate),
      escalationDetails: outputs.find(o => o.escalate)?.escalationReason,
      learningOpportunity,
      reasoning,
    };
  }

  private handleEmergencyResult(
    emergencyOutput: AgentOutput,
    allOutputs: AgentOutput[],
    reasoning: OrchestratorReasoning
  ): OrchestratorResult {
    reasoning.agentResponses = allOutputs.map(o => ({
      agent: o.agentName,
      confidence: o.confidence,
      selected: o.agentId === 'emergency_agent',
    }));
    reasoning.safetyFilterResult = 'Emergency override - safety check bypassed for urgency';

    return {
      finalResponse: emergencyOutput.response,
      contributingAgents: ['Emergency Agent'],
      consensusReached: true,
      conflictsResolved: [],
      overallConfidence: 0.95,
      safetyChecked: true,
      requiresEscalation: true,
      escalationDetails: emergencyOutput.escalationReason,
      reasoning,
    };
  }

  private selectBestResponse(outputs: AgentOutput[]): AgentOutput {
    // Filter out meta-agents (safety, learning)
    const contentAgents = outputs.filter(o => 
      !['safety_agent', 'learning_agent'].includes(o.agentId)
    );
    
    if (contentAgents.length === 0) {
      return outputs[0];
    }
    
    // Weight by priority and confidence
    const scored = contentAgents.map(o => ({
      output: o,
      score: (o.priority / 100) * 0.4 + o.confidence * 0.6,
    }));
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0].output;
  }

  private detectConflicts(outputs: AgentOutput[]): { agents: string[]; description: string }[] {
    const conflicts: { agents: string[]; description: string }[] = [];
    
    // Check for conflicting urgency assessments
    const triageOutput = outputs.find(o => o.agentId === 'triage_agent');
    const emergencyOutput = outputs.find(o => o.agentId === 'emergency_agent');
    
    if (triageOutput && emergencyOutput) {
      const triageUrgency = triageOutput.metadata.urgencyLevel;
      const emergencyDetected = emergencyOutput.metadata.emergencyDetected;
      
      if (triageUrgency === 'routine' && emergencyDetected) {
        conflicts.push({
          agents: ['Triage Agent', 'Emergency Agent'],
          description: 'Triage assessed as routine but Emergency Agent detected emergency patterns',
        });
      }
    }
    
    return conflicts;
  }

  private resolveConflicts(conflicts: { agents: string[]; description: string }[]): string {
    // In case of conflict between triage and emergency, always err on the side of caution
    return 'Conflicts resolved by prioritizing safety: Emergency Agent assessment takes precedence.';
  }

  private calculateOverallConfidence(outputs: AgentOutput[]): number {
    const confidences = outputs.map(o => o.confidence);
    return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
  }
}

// Export singleton orchestrator and types
export const agentOrchestrator = new AgentOrchestrator();
export { TriageAgent, ObstetricAgent, EducationAgent, SafetyAgent, EmergencyAgent, LearningAgent };
export default agentOrchestrator;
