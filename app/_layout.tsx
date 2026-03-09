// app/_layout.tsx
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Slot /> {/* <-- This renders the child routes */}
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
