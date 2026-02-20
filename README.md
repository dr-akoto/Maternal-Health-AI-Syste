# Maternal Health AI System

A comprehensive maternal health monitoring and support application built with React Native (Expo) and Supabase. This platform connects expectant mothers with healthcare providers through AI-powered health tracking, emergency services, and real-time communication.

![React Native](https://img.shields.io/badge/React_Native-0.81.4-blue)
![Expo](https://img.shields.io/badge/Expo-54-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Supabase](https://img.shields.io/badge/Supabase-2.58-green)

## 🌟 Features

### For Mothers
- **AI Health Assistant** - Conversational AI for symptom assessment and health guidance
- **Symptom Tracking** - Log and monitor symptoms with intelligent risk classification
- **Pregnancy Tracker** - Weekly progress tracking with milestones and baby size comparisons
- **Medication Reminders** - Smart reminders for prenatal vitamins and prescriptions
- **Nutrition Guidance** - Meal logging, hydration tracking, and nutrient recommendations
- **Emergency Services** - One-tap emergency alerts with ambulance dispatch integration
- **Pharmacy Locator** - Find nearby pharmacies and manage medication orders
- **Secure Messaging** - Direct communication with assigned healthcare providers

### For Doctors
- **Patient Dashboard** - Overview of all assigned patients with risk indicators
- **Real-time Alerts** - Instant notifications for high-risk symptoms and emergencies
- **AI-Assisted Triage** - AI-generated clinical summaries and risk assessments
- **Patient Messaging** - Secure communication with patients
- **Health Records** - Access to patient health history and vitals

### For Administrators
- **User Management** - Manage mothers, doctors, and system users
- **Hospital Management** - Configure healthcare facilities and services
- **AI Learning Panel** - Review and approve AI training candidates
- **Analytics Dashboard** - System-wide health metrics and usage statistics

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (Expo/React Native)           │
├─────────────────────────────────────────────────────────────┤
│  Mother App  │  Doctor Dashboard  │  Admin Panel            │
├─────────────────────────────────────────────────────────────┤
│                    AI Services Layer                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │Conversational│ │ Diagnostic  │ │  Multi-Agent        │   │
│  │   Engine    │ │  Reasoning  │ │  Orchestrator       │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────────────────────────────┐   │
│  │  Learning   │ │     Explainability Engine           │   │
│  │   System    │ │  (Patient & Clinical Explanations)  │   │
│  └─────────────┘ └─────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Backend Services                         │
│  Supabase (PostgreSQL + Auth + Realtime + Storage)         │
│  Express.js Server (Socket.IO for real-time)               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
project/
├── app/                          # Expo Router screens
│   ├── (mother)/                 # Mother-specific screens
│   │   └── (tabs)/
│   │       ├── index.tsx         # Home/Dashboard
│   │       ├── symptoms.tsx      # Symptom logging
│   │       ├── monitoring.tsx    # Health monitoring
│   │       ├── pregnancy.tsx     # Pregnancy tracker
│   │       ├── medications.tsx   # Medication reminders
│   │       ├── nutrition.tsx     # Nutrition tracking
│   │       ├── pharmacy.tsx      # Pharmacy services
│   │       └── communication.tsx # Messaging
│   ├── (doctor)/                 # Doctor dashboard
│   │   └── (tabs)/
│   │       ├── index.tsx         # Dashboard
│   │       ├── patients.tsx      # Patient list
│   │       ├── alerts.tsx        # Health alerts
│   │       ├── messages.tsx      # Patient messaging
│   │       └── settings.tsx      # Settings
│   ├── (admin)/                  # Admin panel
│   │   └── (tabs)/
│   │       ├── index.tsx         # Admin dashboard
│   │       ├── users.tsx         # User management
│   │       ├── hospitals.tsx     # Hospital management
│   │       ├── ai-learning.tsx   # AI learning management
│   │       └── settings.tsx      # System settings
│   ├── login.tsx                 # Authentication
│   ├── register.tsx              # User registration
│   └── splash.tsx                # Splash screen
├── components/                   # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── EmergencyButton.tsx
│   ├── Input.tsx
│   ├── LoadingScreen.tsx
│   └── RiskBadge.tsx
├── context/                      # React Context providers
│   └── AuthContext.tsx           # Authentication state
├── services/                     # Business logic services
│   ├── ai/                       # AI Engine modules
│   │   ├── AIConversationalEngine.ts
│   │   ├── DiagnosticReasoningEngine.ts
│   │   ├── ExplainabilityEngine.ts
│   │   ├── LearningSystem.ts
│   │   ├── MultiAgentSystem.ts
│   │   └── index.ts
│   ├── aiService.ts              # AI triage service
│   ├── chatService.ts            # Messaging service
│   ├── emergencyService.ts       # Emergency & ambulance
│   ├── medicationReminderService.ts
│   ├── monitoringService.ts      # Health monitoring
│   ├── notificationsService.ts   # Push notifications
│   ├── nutritionGuidanceService.ts
│   ├── offlineSyncService.ts     # Offline support
│   ├── pharmacyService.ts
│   └── pregnancyTrackerService.ts
├── lib/
│   └── supabase.ts               # Supabase client
├── server/                       # Backend server
│   ├── server.ts                 # Express + Socket.IO
│   └── package.json
├── supabase/
│   └── migrations/               # Database migrations
├── types/                        # TypeScript definitions
│   ├── database.types.ts
│   └── supabase.ts
└── assets/                       # Images and icons
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   
   Run the migrations in your Supabase dashboard:
   - Navigate to SQL Editor
   - Run the migration files in `supabase/migrations/` in order

5. **Start the development server**
   ```bash
   npx expo start
   ```

   Or with offline mode (if network issues):
   ```bash
   npx expo start --offline
   ```

6. **Run on device/simulator**
   - Press `w` for web
   - Press `a` for Android
   - Press `i` for iOS

### Running the Backend Server

```bash
cd server
npm install
npm start
```

## 🔐 Authentication & Roles

The system supports three user roles:

| Role | Description | Access |
|------|-------------|--------|
| `mother` | Expectant mothers | Health tracking, AI chat, emergency services |
| `doctor` | Healthcare providers | Patient management, alerts, messaging |
| `admin` | System administrators | User management, AI learning, system config |

## 🤖 AI Features

### Risk Classification Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| Level 1 | Low risk - Normal symptoms | Self-monitoring |
| Level 2 | Moderate risk | Schedule appointment |
| Level 3 | High risk | Urgent consultation (24h) |
| Level 4 | Critical | Immediate emergency care |

### AI Engines

1. **Conversational Engine** - Natural language symptom collection and health guidance
2. **Diagnostic Reasoning** - Clinical decision support with differential diagnosis
3. **Multi-Agent System** - Coordinated AI agents for complex health scenarios
4. **Learning System** - Continuous improvement from anonymized interactions
5. **Explainability Engine** - Transparent AI reasoning for patients and clinicians

## 📱 Key Screens

### Mother Dashboard
- Quick health status overview
- Upcoming appointments
- Medication reminders
- Emergency button

### Symptom Logger
- Voice and text input
- AI-powered symptom analysis
- Risk assessment with explanations
- Automatic doctor notifications for high-risk cases

### Pregnancy Tracker
- Weekly progress visualization
- Baby size comparisons
- Milestone tracking
- Fetal movement counter

## 🚨 Emergency Features

- **One-tap Emergency Button** - Instantly alert healthcare providers
- **Location Sharing** - Automatic GPS location for emergency services
- **Ambulance Dispatch** - Direct integration with ambulance services
- **Doctor Notification** - Real-time alerts to assigned healthcare providers

## 🔧 Configuration

### Supabase Tables

The system uses the following main tables:
- `mother_profiles` - Patient information and health records
- `doctor_profiles` - Healthcare provider profiles
- `admin_profiles` - Administrator accounts
- `emergencies` - Emergency records
- `health_records` - Vital signs and health data
- `messages` - Secure messaging
- `ai_conversations` - AI interaction logs
- `medication_reminders` - Medication schedules
- `nutrition_logs` - Meal and hydration tracking

### Row Level Security (RLS)

All tables implement RLS policies:
- Mothers can only access their own data
- Doctors can view assigned patients
- Admins have full system access

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

Please read our contribution guidelines before submitting pull requests.

## 📞 Support

For technical support, please contact the development team.

---

Built with ❤️ for maternal health
