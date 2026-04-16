import { Redirect } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner size="full" label="TRANG ANH STORE" />;
  }

  return isAuthenticated
    ? <Redirect href="/(admin)" />
    : <Redirect href="/(auth)/login" />;
}
