import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useConfig } from '../core/config/ConfigContext';
import { useAuth } from '../core/auth/AuthContext';

export default function Index() {
  const { config, isLoading: configLoading } = useConfig();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (configLoading || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!config) return <Redirect href="/setup" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(app)" />;
}
