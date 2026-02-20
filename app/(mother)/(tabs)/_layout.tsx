import { Tabs } from 'expo-router';
import {
  Home,
  Activity,
  HeartPulse,
  MessageCircle,
  Pill,
  Baby,
  Utensils,
} from 'lucide-react-native';

export default function MotherTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pregnancy"
        options={{
          title: 'Pregnancy',
          tabBarIcon: ({ color, size }) => <Baby size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="symptoms"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="monitoring"
        options={{
          title: 'Vitals',
          tabBarIcon: ({ color, size }) => (
            <HeartPulse size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Meds',
          tabBarIcon: ({ color, size }) => <Pill size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, size }) => <Utensils size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="communication"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
          href: null, // Hidden from tab bar but accessible via navigation
        }}
      />
      <Tabs.Screen
        name="pharmacy"
        options={{
          title: 'Pharmacy',
          tabBarIcon: ({ color, size }) => <Pill size={size} color={color} />,
          href: null, // Hidden from tab bar but accessible via navigation
        }}
      />
    </Tabs>
  );
}
