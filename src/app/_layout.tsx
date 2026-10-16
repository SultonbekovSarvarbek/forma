import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/lib/theme';
import { AppStoreProvider } from '@/store/AppStore';

export default function RootLayout() {
  return (
    <AppStoreProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          headerBackTitle: 'Назад',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: '' }} />
        <Stack.Screen name="plan/[id]" options={{ title: 'Рацион' }} />
        <Stack.Screen name="questionnaire" options={{ title: 'Анкета', presentation: 'modal' }} />
        <Stack.Screen name="my-plan" options={{ title: 'Мой план' }} />
      </Stack>
    </AppStoreProvider>
  );
}
