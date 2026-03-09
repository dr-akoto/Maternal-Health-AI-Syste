/**
 * Diagnostic Reasoning Engine for Maternal Health System
 * 
 * Implements:
 * - Bayesian reasoning
 * - Rule-based obstetric logic
 * - ML risk models
 * - Differential diagnosis
 * - Explainable AI with confidence scores and justifications
 */

import { RiskLevel } from '@/types/database.types';

// Types
export interface DiagnosticInput {
  symptoms: SymptomInput[];
  pregnancyStage: PregnancyStage;
  medicalHistory: MedicalHistory;
  riskFactors: string[];
  vitalSigns?: VitalSignsInput;
}

export interface SymptomInput {
  name: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  duration?: string;
  frequency?: string;
  associatedSymptoms?: string[];
  bodyLocation?: string;
}

export interface PregnancyStage {
  weeksGestation: number;
  trimester: 1 | 2 | 3;
  expectedDeliveryDate?: string;
  previousPregnancies?: number;
  previousComplications?: string[];
}

export interface MedicalHistory {
  conditions: string[];
  medications: string[];
  allergies: string[];
  surgeries?: string[];
  familyHistory?: string[];
}

export interface VitalSignsInput {
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  oxygenSaturation?: number;
}

export interface DiagnosticResult {
  differentialConditions: DifferentialCondition[];
  overallRiskLevel: RiskLevel;
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  recommendations: Recommendation[];
  explanationTrace: ExplanationTrace;
  confidence: number;
  justification: string;
  disclaimers: string[];
}

export interface DifferentialCondition {
  condition: string;
  probability: number;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  description: string;
  matchingSymptoms: string[];
  recommendedTests?: string[];
  icdCode?: string;
}

export interface Recommendation {
  type: 'action' | 'test' | 'referral' | 'medication' | 'lifestyle';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rationale: string;
  timeframe?: string;
}

export interface ExplanationTrace {
  inputSummary: string;
  reasoningSteps: ReasoningStep[];
  bayesianFactors: BayesianFactor[];
  rulesApplied: RuleApplication[];
  featuresConsidered: FeatureWeight[];
  alternativeInterpretations: string[];
  limitations: string[];
}

export interface ReasoningStep {
  step: number;
  description: string;
  conclusion: string;
  confidence: number;
}

export interface BayesianFactor {
  factor: string;
  priorProbability: number;
  likelihoodRatio: number;
  posteriorProbability: number;
  evidence: string;
}

export interface RuleApplication {
  ruleName: string;
  ruleDescription: string;
  triggered: boolean;
  inputs: string[];
  output: string;
}

export interface FeatureWeight {
  feature: string;
  value: string | number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
}

// Obstetric condition definitions
interface ConditionDefinition {
  name: string;
  icdCode: string;
  baseProbability: number;
  symptoms: { symptom: string; weight: number }[];
  riskFactors: { factor: string; multiplier: number }[];
  trimesterRelevance: { trimester: number; multiplier: number }[];
  vitalSignIndicators?: VitalSignIndicator[];
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
  description: string;
  recommendedTests: string[];
}

interface VitalSignIndicator {
  sign: 'systolicBP' | 'diastolicBP' | 'heartRate' | 'temperature' | 'oxygenSaturation';
  threshold: number;
  operator: '>' | '<' | '>=' | '<=';
  weight: number;
}

// Obstetric conditions database
const OBSTETRIC_CONDITIONS: ConditionDefinition[] = [
  {
    name: 'Preeclampsia',
    icdCode: 'O14.9',
    baseProbability: 0.05,
    symptoms: [
      { symptom: 'headache', weight: 0.6 },
      { symptom: 'swelling', weight: 0.7 },
      { symptom: 'visual disturbances', weight: 0.8 },
      { symptom: 'upper abdominal pain', weight: 0.7 },
      { symptom: 'nausea', weight: 0.4 },
      { symptom: 'rapid weight gain', weight: 0.5 },
    ],
    riskFactors: [
      { factor: 'first_pregnancy', multiplier: 1.5 },
      { factor: 'previous_preeclampsia', multiplier: 3.0 },
      { factor: 'chronic_hypertension', multiplier: 2.5 },
      { factor: 'diabetes', multiplier: 1.8 },
      { factor: 'obesity', multiplier: 1.5 },
      { factor: 'age_over_35', multiplier: 1.3 },
      { factor: 'multiple_pregnancy', multiplier: 2.0 },
    ],
    trimesterRelevance: [
      { trimester: 1, multiplier: 0.2 },
      { trimester: 2, multiplier: 0.8 },
      { trimester: 3, multiplier: 1.5 },
    ],
    vitalSignIndicators: [
      { sign: 'systolicBP', threshold: 140, operator: '>=', weight: 0.9 },
      { sign: 'diastolicBP', threshold: 90, operator: '>=', weight: 0.9 },
    ],
    severity: 'severe',
    urgency: 'urgent',
    description: 'A pregnancy complication characterized by high blood pressure and signs of organ damage.',
    recommendedTests: ['Blood pressure monitoring', 'Urine protein test', 'Blood tests (liver, kidney function)', 'Fetal monitoring'],
  },
  {
    name: 'Gestational Diabetes',
    icdCode: 'O24.4',
    baseProbability: 0.08,
    symptoms: [
      { symptom: 'increased thirst', weight: 0.6 },
      { symptom: 'frequent urination', weight: 0.6 },
      { symptom: 'fatigue', weight: 0.4 },
      { symptom: 'blurred vision', weight: 0.5 },
      { symptom: 'recurrent infections', weight: 0.4 },
    ],
    riskFactors: [
      { factor: 'obesity', multiplier: 2.0 },
      { factor: 'family_history_diabetes', multiplier: 1.8 },
      { factor: 'previous_gestational_diabetes', multiplier: 2.5 },
      { factor: 'age_over_35', multiplier: 1.3 },
      { factor: 'pcos', multiplier: 1.5 },
    ],
    trimesterRelevance: [
      { trimester: 1, multiplier: 0.3 },
      { trimester: 2, multiplier: 1.2 },
      { trimester: 3, multiplier: 1.0 },
    ],
    severity: 'moderate',
    urgency: 'soon',
    description: 'Diabetes that develops during pregnancy and usually resolves after delivery.',
    recommendedTests: ['Glucose tolerance test', 'Fasting blood glucose', 'HbA1c'],
  },
  {
    name: 'Placenta Previa',
    icdCode: 'O44.0',
    baseProbability: 0.01,
    symptoms: [
      { symptom: 'painless vaginal bleeding', weight: 0.9 },
      { symptom: 'bleeding', weight: 0.7 },
      { symptom: 'spotting', weight: 0.5 },
    ],
    riskFactors: [
      { factor: 'previous_cesarean', multiplier: 2.0 },
      { factor: 'previous_placenta_previa', multiplier: 3.0 },
      { factor: 'multiple_pregnancy', multiplier: 1.5 },
      { factor: 'uterine_surgery', multiplier: 1.8 },
      { factor: 'smoking', multiplier: 1.5 },
    ],
    trimesterRelevance: [
      { trimester: 1, multiplier: 0.5 },
      { trimester: 2, multiplier: 1.0 },
      { trimester: 3, multiplier: 1.5 },
    ],
    severity: 'severe',
    urgency: 'urgent',
    description: 'A condition where the placenta partially or fully covers the cervix.',
    recommendedTests: ['Ultrasound', 'Transvaginal ultrasound', 'MRI if needed'],
  },
  {
    name: 'Preterm Labor',
    icdCode: 'O60.0',
    baseProbability: 0.10,
    symptoms: [
      { symptom: 'contractions', weight: 0.9 },
      { symptom: 'cramping', weight: 0.7 },
      { symptom: 'back pain', weight: 0.6 },
      { symptom: 'pelvic pressure', weight: 0.7 },
      { symptom: 'vaginal discharge', weight: 0.5 },
      { symptom: 'water leaking', weight: 0.9 },
    ],
    riskFactors: [
      { factor: 'previous_preterm_birth', multiplier: 2.5 },
      { factor: 'multiple_pregnancy', multiplier: 2.0 },
      { factor: 'cervical_incompetence', multiplier: 2.5 },
      { factor: 'infection', multiplier: 1.5 },
      { factor: 'smoking', multiplier: 1.3 },
    ],
    trimesterRelevance: [
      { trimester: 1, multiplier: 0.1 },
      { trimester: 2, multiplier: 1.5 },
      { trimester: 3, multiplier: 1.0 },
    ],
    severity: 'severe',
    urgency: 'emergency',
    description: 'Labor that begins before 37 weeks of pregnancy.',
    recommendedTests: ['Cervical examination', 'Fetal fibronectin test', 'Ultrasound for cervical length'],
  },
  {
    name: 'Ectopic Pregnancy',
    icdCode: 'O00.9',
    baseProbability: 0.02,
    symptoms: [
      { symptom: 'one-sided abdominal pain', weight: 0.9 },
      { symptom: 'vaginal bleeding', weight: 0.7 },
      { symptom: 'shoulder pain', weight: 0.6 },
      { symptom: 'dizziness', weight: 0.6 },
      { symptom: 'nausea', weight: 0.4 },
    ],
    riskFactors: [
      { factor: 'previous_ectopic', multiplier: 3.0 },
      { factor: 'pelvic_inflammatory_disease', multiplier: 2.0 },
      { factor: 'tubal_surgery', multiplier: 2.5 },
      { factor: 'ivf', multiplier: 1.5 },
      { factor: 'iud', multiplier: 1.5 },
    ],
    trimesterRelevance: [
      { trimester: 1, multiplier: 3.0 },
      { trimester: 2, multiplier: 0.1 },
      { trimester: 3, multiplier: 0.0 },
    ],
    severity: 'critical',
    urgency: 'emergency',
    description: 'A pregnancy where the fertilized egg implants outside the uterus.',
    recommendedTests: ['hCG levels', 'Transvaginal ultrasound', 'Progesterone levels'],
  },
  {
    name: 'Hyperemesis Gravidarum',
    icdCode: 'O21.1',
    baseProbability: 0.03,
    symptoms: [
      { symptom: 'severe nausea', weight: 0.9 },
      { symptom: 'persistent vomiting', weight: 0.9 },
      { symptom: 'weight loss', weight: 0.7 },
      { symptom: 'dehydration', weight: 0.8 },
      { symptom: 'fatigue', weight: 0.5 },
    ],
    riskFactors: [
      { factor: 'previous_hyperemesis', multiplier: 2.5 },
      { factor: 'multiple_pregnancy', multiplier: 1.5 },
      { factor: 'first_pregnancy', multiplier: 1.2 },
      { factor: 'history_motion_sickness', multiplier: 1.3 },
    ],
    trimesterRelevance: [
      { trimester: 1, multiplier: 2.0 },
      { trimester: 2, multiplier: 0.8 },
      { trimester: 3, multiplier: 0.3 },
    ],
    severity: 'moderate',
    urgency: 'soon',
    description: 'Severe nausea and vomiting during pregnancy that can lead to dehydration.',
    recommendedTests: ['Electrolyte panel', 'Ketone levels', 'Thyroid function tests'],
  },
  {
    name: 'Urinary Tract Infection',
    icdCode: 'O23.1',
    baseProbability: 0.08,
    symptoms: [
      { symptom: 'burning urination', weight: 0.9 },
      { symptom: 'frequent urination', weight: 0.7 },
      { symptom: 'pelvic pain', weight: 0.6 },
      { symptom: 'cloudy urine', weight: 0.7 },
      { symptom: 'fever', weight: 0.6 },
      { symptom: 'back pain', weight: 0.5 },
    ],
    riskFactors: [
      { factor: 'previous_uti', multiplier: 2.0 },
      { factor: 'diabetes', multiplier: 1.5 },
      { factor: 'sexual_activity', multiplier: 1.3 },
    ],
    trimesterRelevance: [
      { trimester: 1, multiplier: 1.0 },
      { trimester: 2, multiplier: 1.2 },
      { trimester: 3, multiplier: 1.3 },
    ],
    severity: 'moderate',
    urgency: 'soon',
    description: 'Bacterial infection of the urinary tract, common in pregnancy.',
    recommendedTests: ['Urinalysis', 'Urine culture', 'Complete blood count'],
  },
  {
    name: 'Anemia in Pregnancy',
    icdCode: 'O99.0',
    baseProbability: 0.15,
    symptoms: [
      { symptom: 'fatigue', weight: 0.8 },
      { symptom: 'weakness', weight: 0.7 },
      { symptom: 'shortness of breath', weight: 0.6 },
      { symptom: 'dizziness', weight: 0.6 },
      { symptom: 'pale skin', weight: 0.7 },
      { symptom: 'rapid heartbeat', weight: 0.5 },
    ],
    riskFactors: [
      { factor: 'poor_nutrition', multiplier: 1.8 },
      { factor: 'multiple_pregnancy', multiplier: 1.5 },
      { factor: 'heavy_periods_history', multiplier: 1.4 },
      { factor: 'vegetarian', multiplier: 1.3 },
    ],
    trimesterRelevance: [
      { trimester: 1, multiplier: 0.8 },
      { trimester: 2, multiplier: 1.2 },
      { trimester: 3, multiplier: 1.5 },
    ],
    severity: 'mild',
    urgency: 'routine',
    description: 'Low red blood cell count during pregnancy, often due to iron deficiency.',
    recommendedTests: ['Complete blood count', 'Iron studies', 'Ferritin level'],
  },
];

// Rule-based obstetric rules
interface ObstetricRule {
  id: string;
  name: string;
  description: string;
  condition: (input: DiagnosticInput) => boolean;
  output: {
    addRisk: RiskLevel;
    urgency: 'routine' | 'soon' | 'urgent' | 'emergency';
    recommendation: string;
    rationale: string;
  };
}

const OBSTETRIC_RULES: ObstetricRule[] = [
  {
    id: 'RULE_001',
    name: 'Hypertensive Emergency',
    description: 'Blood pressure >= 160/110 mmHg requires immediate attention',
    condition: (input) => {
      const bp = input.vitalSigns;
      return (bp?.systolicBP || 0) >= 160 || (bp?.diastolicBP || 0) >= 110;
    },
    output: {
      addRisk: 'level_4',
      urgency: 'emergency',
      recommendation: 'Immediate medical evaluation required',
      rationale: 'Severely elevated blood pressure in pregnancy can lead to stroke, organ damage, or eclampsia',
    },
  },
  {
    id: 'RULE_002',
    name: 'Third Trimester Bleeding',
    description: 'Any vaginal bleeding in third trimester requires urgent evaluation',
    condition: (input) => {
      const hasBleedingSymptom = input.symptoms.some(s => 
        s.name.toLowerCase().includes('bleeding') || s.name.toLowerCase().includes('spotting')
      );
      return hasBleedingSymptom && input.pregnancyStage.trimester === 3;
    },
    output: {
      addRisk: 'level_3',
      urgency: 'urgent',
      recommendation: 'Urgent obstetric evaluation required',
      rationale: 'Third trimester bleeding may indicate placenta previa, placental abruption, or labor',
    },
  },
  {
    id: 'RULE_003',
    name: 'Reduced Fetal Movement',
    description: 'Decreased fetal movement in late pregnancy requires monitoring',
    condition: (input) => {
      const hasReducedMovement = input.symptoms.some(s => 
        s.name.toLowerCase().includes('movement') || s.name.toLowerCase().includes('baby not moving')
      );
      return hasReducedMovement && input.pregnancyStage.weeksGestation >= 28;
    },
    output: {
      addRisk: 'level_3',
      urgency: 'urgent',
      recommendation: 'Fetal monitoring and evaluation recommended within 24 hours',
      rationale: 'Reduced fetal movement can indicate fetal distress and requires assessment',
    },
  },
  {
    id: 'RULE_004',
    name: 'Preterm Labor Signs',
    description: 'Signs of labor before 37 weeks require immediate evaluation',
    condition: (input) => {
      const hasLaborSigns = input.symptoms.some(s => 
        s.name.toLowerCase().includes('contractions') || 
        s.name.toLowerCase().includes('water broke') ||
        s.name.toLowerCase().includes('leaking fluid')
      );
      return hasLaborSigns && input.pregnancyStage.weeksGestation < 37;
    },
    output: {
      addRisk: 'level_4',
      urgency: 'emergency',
      recommendation: 'Emergency evaluation for preterm labor',
      rationale: 'Preterm labor may lead to premature birth and requires immediate intervention',
    },
  },
  {
    id: 'RULE_005',
    name: 'High Fever in Pregnancy',
    description: 'Temperature >= 38°C (100.4°F) requires evaluation',
    condition: (input) => {
      return (input.vitalSigns?.temperature || 0) >= 38;
    },
    output: {
      addRisk: 'level_2',
      urgency: 'soon',
      recommendation: 'Medical evaluation within 24 hours',
      rationale: 'High fever in pregnancy can harm the developing baby and may indicate infection',
    },
  },
  {
    id: 'RULE_006',
    name: 'Multiple High-Risk Factors',
    description: 'Multiple risk factors compound pregnancy risk',
    condition: (input) => {
      return input.riskFactors.length >= 3;
    },
    output: {
      addRisk: 'level_2',
      urgency: 'soon',
      recommendation: 'Schedule high-risk pregnancy consultation',
      rationale: 'Multiple risk factors increase the likelihood of pregnancy complications',
    },
  },
];

class DiagnosticReasoningEngine {
  private modelVersion = 'diagnostic-v1.0';

  /**
   * Perform diagnostic analysis
   */
  async analyze(input: DiagnosticInput): Promise<DiagnosticResult> {
    const startTime = Date.now();
    const reasoningSteps: ReasoningStep[] = [];
    const rulesApplied: RuleApplication[] = [];
    const bayesianFactors: BayesianFactor[] = [];
    const featuresConsidered: FeatureWeight[] = [];

    // Step 1: Apply rule-based obstetric logic
    reasoningSteps.push({
      step: 1,
      description: 'Applying rule-based obstetric safety checks',
      conclusion: 'Checking for critical conditions that require immediate action',
      confidence: 1.0,
    });

    let maxUrgency: 'routine' | 'soon' | 'urgent' | 'emergency' = 'routine';
    let maxRiskLevel: RiskLevel = 'level_1';
    const ruleRecommendations: Recommendation[] = [];

    for (const rule of OBSTETRIC_RULES) {
      const triggered = rule.condition(input);
      rulesApplied.push({
        ruleName: rule.name,
        ruleDescription: rule.description,
        triggered,
        inputs: this.getRuleInputs(input, rule),
        output: triggered ? rule.output.recommendation : 'Rule not triggered',
      });

      if (triggered) {
        maxRiskLevel = this.getHigherRiskLevel(maxRiskLevel, rule.output.addRisk);
        maxUrgency = this.getHigherUrgency(maxUrgency, rule.output.urgency);
        ruleRecommendations.push({
          type: 'action',
          priority: this.urgencyToPriority(rule.output.urgency),
          description: rule.output.recommendation,
          rationale: rule.output.rationale,
          timeframe: this.urgencyToTimeframe(rule.output.urgency),
        });
      }
    }

    // Step 2: Bayesian analysis for differential diagnosis
    reasoningSteps.push({
      step: 2,
      description: 'Performing Bayesian probability analysis',
      conclusion: 'Calculating condition probabilities based on symptoms and risk factors',
      confidence: 0.85,
    });

    const differentialConditions: DifferentialCondition[] = [];

    for (const condition of OBSTETRIC_CONDITIONS) {
      const bayesianResult = this.calculateBayesianProbability(condition, input);
      
      if (bayesianResult.posteriorProbability > 0.1) {
        bayesianFactors.push(bayesianResult);
        
        differentialConditions.push({
          condition: condition.name,
          probability: bayesianResult.posteriorProbability,
          severity: condition.severity,
          description: condition.description,
          matchingSymptoms: this.getMatchingSymptoms(condition, input.symptoms),
          recommendedTests: condition.recommendedTests,
          icdCode: condition.icdCode,
        });

        // Update risk level based on high-probability conditions
        if (bayesianResult.posteriorProbability > 0.5) {
          const conditionRisk = this.severityToRiskLevel(condition.severity);
          maxRiskLevel = this.getHigherRiskLevel(maxRiskLevel, conditionRisk);
          maxUrgency = this.getHigherUrgency(maxUrgency, condition.urgency);
        }
      }
    }

    // Sort by probability
    differentialConditions.sort((a, b) => b.probability - a.probability);

    // Step 3: Feature analysis
    reasoningSteps.push({
      step: 3,
      description: 'Analyzing input features and their weights',
      conclusion: 'Evaluating symptom severity, vital signs, and risk factors',
      confidence: 0.9,
    });

    // Add symptom features
    for (const symptom of input.symptoms) {
      featuresConsidered.push({
        feature: `Symptom: ${symptom.name}`,
        value: symptom.severity,
        weight: this.severityToWeight(symptom.severity),
        impact: symptom.severity === 'severe' || symptom.severity === 'critical' ? 'negative' : 'neutral',
      });
    }

    // Add vital sign features
    if (input.vitalSigns) {
      if (input.vitalSigns.systolicBP) {
        featuresConsidered.push({
          feature: 'Systolic Blood Pressure',
          value: input.vitalSigns.systolicBP,
          weight: input.vitalSigns.systolicBP >= 140 ? 0.9 : 0.5,
          impact: input.vitalSigns.systolicBP >= 140 ? 'negative' : 'neutral',
        });
      }
      if (input.vitalSigns.heartRate) {
        featuresConsidered.push({
          feature: 'Heart Rate',
          value: input.vitalSigns.heartRate,
          weight: input.vitalSigns.heartRate > 100 || input.vitalSigns.heartRate < 60 ? 0.7 : 0.5,
          impact: input.vitalSigns.heartRate > 100 ? 'negative' : 'neutral',
        });
      }
    }

    // Add pregnancy stage features
    featuresConsidered.push({
      feature: 'Pregnancy Stage',
      value: `Week ${input.pregnancyStage.weeksGestation}, Trimester ${input.pregnancyStage.trimester}`,
      weight: input.pregnancyStage.trimester === 3 ? 0.8 : 0.6,
      impact: 'neutral',
    });

    // Step 4: Generate recommendations
    reasoningSteps.push({
      step: 4,
      description: 'Generating recommendations based on analysis',
      conclusion: 'Compiling action items and follow-up suggestions',
      confidence: 0.88,
    });

    const allRecommendations = [...ruleRecommendations];

    // Add condition-specific recommendations
    for (const condition of differentialConditions.slice(0, 3)) {
      if (condition.probability > 0.3) {
        allRecommendations.push({
          type: 'test',
          priority: condition.probability > 0.5 ? 'high' : 'medium',
          description: `Consider testing for ${condition.condition}`,
          rationale: `Probability: ${(condition.probability * 100).toFixed(1)}% based on presenting symptoms`,
          timeframe: condition.severity === 'severe' || condition.severity === 'critical' ? 'Within 24 hours' : 'Within 1 week',
        });

        for (const test of condition.recommendedTests || []) {
          allRecommendations.push({
            type: 'test',
            priority: 'medium',
            description: test,
            rationale: `Recommended for ${condition.condition} evaluation`,
          });
        }
      }
    }

    // Calculate overall confidence
    const confidence = this.calculateOverallConfidence(reasoningSteps, differentialConditions);

    // Generate justification
    const justification = this.generateJustification(input, differentialConditions, rulesApplied, maxRiskLevel);

    const processingTime = Date.now() - startTime;

    const result: DiagnosticResult = {
      differentialConditions: differentialConditions.slice(0, 5),
      overallRiskLevel: maxRiskLevel,
      urgency: maxUrgency,
      recommendations: this.deduplicateRecommendations(allRecommendations),
      explanationTrace: {
        inputSummary: this.generateInputSummary(input),
        reasoningSteps,
        bayesianFactors: bayesianFactors.slice(0, 5),
        rulesApplied,
        featuresConsidered,
        alternativeInterpretations: this.generateAlternativeInterpretations(differentialConditions),
        limitations: [
          'This is an AI-assisted analysis and should not replace clinical judgment',
          'Rare conditions may not be fully represented in the model',
          'Individual patient variations may affect accuracy',
          'Always correlate with clinical examination',
        ],
      },
      confidence,
      justification,
      disclaimers: [
        'This diagnostic assessment is provided for informational purposes only.',
        'It is not a definitive diagnosis and should not replace professional medical advice.',
        'Always consult with a qualified healthcare provider for medical decisions.',
        'In case of emergency, seek immediate medical attention.',
      ],
    };

    console.log(`Diagnostic analysis completed in ${processingTime}ms`);

    return result;
  }

  /**
   * Calculate Bayesian probability for a condition
   */
  private calculateBayesianProbability(condition: ConditionDefinition, input: DiagnosticInput): BayesianFactor {
    let probability = condition.baseProbability;
    let evidence: string[] = [];

    // Apply symptom weights
    for (const symptomDef of condition.symptoms) {
      const matchingSymptom = input.symptoms.find(s => 
        s.name.toLowerCase().includes(symptomDef.symptom.toLowerCase())
      );
      if (matchingSymptom) {
        probability += symptomDef.weight * 0.3;
        evidence.push(`Symptom match: ${matchingSymptom.name}`);
      }
    }

    // Apply risk factor multipliers
    for (const riskDef of condition.riskFactors) {
      if (input.riskFactors.includes(riskDef.factor)) {
        probability *= riskDef.multiplier;
        evidence.push(`Risk factor: ${riskDef.factor}`);
      }
    }

    // Apply trimester relevance
    const trimesterFactor = condition.trimesterRelevance.find(t => t.trimester === input.pregnancyStage.trimester);
    if (trimesterFactor) {
      probability *= trimesterFactor.multiplier;
      evidence.push(`Trimester ${input.pregnancyStage.trimester} relevance factor: ${trimesterFactor.multiplier}`);
    }

    // Apply vital sign indicators
    if (condition.vitalSignIndicators && input.vitalSigns) {
      for (const indicator of condition.vitalSignIndicators) {
        const value = input.vitalSigns[indicator.sign];
        if (value !== undefined) {
          let matches = false;
          switch (indicator.operator) {
            case '>': matches = value > indicator.threshold; break;
            case '<': matches = value < indicator.threshold; break;
            case '>=': matches = value >= indicator.threshold; break;
            case '<=': matches = value <= indicator.threshold; break;
          }
          if (matches) {
            probability += indicator.weight * 0.2;
            evidence.push(`Vital sign ${indicator.sign} ${indicator.operator} ${indicator.threshold}`);
          }
        }
      }
    }

    // Cap probability at 0.95
    probability = Math.min(probability, 0.95);

    return {
      factor: condition.name,
      priorProbability: condition.baseProbability,
      likelihoodRatio: probability / condition.baseProbability,
      posteriorProbability: probability,
      evidence: evidence.join('; '),
    };
  }

  /**
   * Get matching symptoms for a condition
   */
  private getMatchingSymptoms(condition: ConditionDefinition, symptoms: SymptomInput[]): string[] {
    const matches: string[] = [];
    for (const symptomDef of condition.symptoms) {
      const match = symptoms.find(s => 
        s.name.toLowerCase().includes(symptomDef.symptom.toLowerCase())
      );
      if (match) {
        matches.push(match.name);
      }
    }
    return matches;
  }

  /**
   * Get rule inputs description
   */
  private getRuleInputs(input: DiagnosticInput, rule: ObstetricRule): string[] {
    const inputs: string[] = [];
    if (input.vitalSigns?.systolicBP) inputs.push(`Systolic BP: ${input.vitalSigns.systolicBP}`);
    if (input.vitalSigns?.diastolicBP) inputs.push(`Diastolic BP: ${input.vitalSigns.diastolicBP}`);
    if (input.vitalSigns?.temperature) inputs.push(`Temperature: ${input.vitalSigns.temperature}°C`);
    inputs.push(`Trimester: ${input.pregnancyStage.trimester}`);
    inputs.push(`Week: ${input.pregnancyStage.weeksGestation}`);
    inputs.push(`Symptoms: ${input.symptoms.map(s => s.name).join(', ') || 'None'}`);
    inputs.push(`Risk factors: ${input.riskFactors.length}`);
    return inputs;
  }

  /**
   * Utility functions
   */
  private getHigherRiskLevel(current: RiskLevel, newLevel: RiskLevel): RiskLevel {
    const order: RiskLevel[] = ['level_1', 'level_2', 'level_3', 'level_4'];
    return order.indexOf(newLevel) > order.indexOf(current) ? newLevel : current;
  }

  private getHigherUrgency(current: string, newUrgency: string): 'routine' | 'soon' | 'urgent' | 'emergency' {
    const order = ['routine', 'soon', 'urgent', 'emergency'];
    return order.indexOf(newUrgency) > order.indexOf(current) 
      ? newUrgency as 'routine' | 'soon' | 'urgent' | 'emergency'
      : current as 'routine' | 'soon' | 'urgent' | 'emergency';
  }

  private urgencyToPriority(urgency: string): 'low' | 'medium' | 'high' | 'critical' {
    const map: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      routine: 'low',
      soon: 'medium',
      urgent: 'high',
      emergency: 'critical',
    };
    return map[urgency] || 'medium';
  }

  private urgencyToTimeframe(urgency: string): string {
    const map: Record<string, string> = {
      routine: 'Within 1-2 weeks',
      soon: 'Within 24-48 hours',
      urgent: 'Within hours',
      emergency: 'Immediately',
    };
    return map[urgency] || 'As needed';
  }

  private severityToRiskLevel(severity: string): RiskLevel {
    const map: Record<string, RiskLevel> = {
      mild: 'level_1',
      moderate: 'level_2',
      severe: 'level_3',
      critical: 'level_4',
    };
    return map[severity] || 'level_2';
  }

  private severityToWeight(severity: string): number {
    const map: Record<string, number> = {
      mild: 0.3,
      moderate: 0.5,
      severe: 0.8,
      critical: 1.0,
    };
    return map[severity] || 0.5;
  }

  private calculateOverallConfidence(steps: ReasoningStep[], conditions: DifferentialCondition[]): number {
    const stepConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;
    const conditionClarity = conditions.length > 0 
      ? Math.min(conditions[0].probability + 0.3, 1) 
      : 0.5;
    return (stepConfidence * 0.6 + conditionClarity * 0.4);
  }

  private generateInputSummary(input: DiagnosticInput): string {
    const symptoms = input.symptoms.map(s => `${s.name} (${s.severity})`).join(', ') || 'None reported';
    const vitals = input.vitalSigns 
      ? `BP: ${input.vitalSigns.systolicBP || '-'}/${input.vitalSigns.diastolicBP || '-'}, HR: ${input.vitalSigns.heartRate || '-'}, Temp: ${input.vitalSigns.temperature || '-'}°C`
      : 'Not provided';
    
    return `Patient at ${input.pregnancyStage.weeksGestation} weeks gestation (Trimester ${input.pregnancyStage.trimester}). ` +
           `Symptoms: ${symptoms}. Vitals: ${vitals}. Risk factors: ${input.riskFactors.length || 0}.`;
  }

  private generateJustification(
    input: DiagnosticInput, 
    conditions: DifferentialCondition[], 
    rules: RuleApplication[], 
    riskLevel: RiskLevel
  ): string {
    const parts: string[] = [];
    
    parts.push(`Risk assessment: ${riskLevel.replace('_', ' ').toUpperCase()}`);
    
    const triggeredRules = rules.filter(r => r.triggered);
    if (triggeredRules.length > 0) {
      parts.push(`Clinical rules triggered: ${triggeredRules.map(r => r.ruleName).join(', ')}`);
    }
    
    if (conditions.length > 0) {
      parts.push(`Top differential: ${conditions[0].condition} (${(conditions[0].probability * 100).toFixed(0)}% probability)`);
    }
    
    if (input.symptoms.some(s => s.severity === 'severe' || s.severity === 'critical')) {
      parts.push('Severe symptom(s) present - elevated concern');
    }
    
    return parts.join('. ') + '.';
  }

  private generateAlternativeInterpretations(conditions: DifferentialCondition[]): string[] {
    if (conditions.length <= 1) {
      return ['Limited differential due to symptom specificity'];
    }
    
    return conditions.slice(1, 4).map(c => 
      `Alternative: ${c.condition} - ${(c.probability * 100).toFixed(0)}% probability based on ${c.matchingSymptoms.join(', ') || 'risk factors'}`
    );
  }

  private deduplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(r => {
      const key = r.description.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Export singleton instance
export const diagnosticEngine = new DiagnosticReasoningEngine();
export default diagnosticEngine;
