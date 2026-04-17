import { Stack } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initialize().then(() => setInitialized(true));
  }, []);

  // Show loading only during initial auth check
  if (!initialized || isLoading) {
    return <LoadingSpinner size="full" label="TRANG ANH STORE" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="(admin)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
      <Toast />
    </QueryClientProvider>
  );
}
