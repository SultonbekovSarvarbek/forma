import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';

import type { IconName } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useStore } from '@/store/AppStore';

function icon(name: IconName) {
  function TabIcon({ focused, size }: { focused: boolean; size: number }) {
    return <Ionicons name={name} size={size} color={focused ? colors.accent : colors.faint} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const { totals } = useStore();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 20 },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Главная', headerShown: false, tabBarIcon: icon('home') }} />
      <Tabs.Screen name="catalog" options={{ title: 'Спортпит', tabBarIcon: icon('barbell') }} />
      <Tabs.Screen name="meals" options={{ title: 'Рационы', tabBarIcon: icon('restaurant') }} />
      <Tabs.Screen name="coach" options={{ title: 'AI-консультант', tabBarLabel: 'AI', tabBarIcon: icon('sparkles') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Корзина',
          tabBarIcon: icon('cart'),
          tabBarBadge: totals.itemsCount > 0 ? totals.itemsCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.onAccent, fontWeight: '700' },
        }}
      />
    </Tabs>
  );
}
