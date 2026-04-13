import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';

export default function Index() {
  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initialize().then(() => setInitialized(true));
  }, []);

  if (!initialized || isLoading) {
    return <LoadingSpinner size="full" label="TRANG ANH" />;
  }

  return isAuthenticated
    ? <Redirect href="/(admin)" />
    : <Redirect href="/(auth)/login" />;
}
