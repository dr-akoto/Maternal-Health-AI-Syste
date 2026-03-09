// app/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Delay to ensure RootLayout is mounted
    const timeout = setTimeout(() => {
      router.replace('/splash');
    }, 50);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
