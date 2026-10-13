import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../components/ui';
import { useTheme } from '../../theme';

const TABS: { name: string; title: string; icon: string; iconActive: string }[] = [
  { name: 'index', title: 'Início', icon: 'home-variant-outline', iconActive: 'home-variant' },
  { name: 'explorar', title: 'Explorar', icon: 'compass-outline', iconActive: 'compass' },
  { name: 'montar', title: 'Montar', icon: 'playlist-plus', iconActive: 'playlist-plus' },
  { name: 'rotinas', title: 'Rotinas', icon: 'bookmark-outline', iconActive: 'bookmark' },
  { name: 'progresso', title: 'Progresso', icon: 'chart-line', iconActive: 'chart-line' },
];

export default function TabsLayout() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          // Ícone (28) + rótulo (14) + respiro interno do item (10) = 52; sobra folga para não cortar o rótulo.
          height: 62 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom + 4,
        },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: '600', flexShrink: 0 },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused, size }) => (
              <Icon name={focused ? t.iconActive : t.icon} size={size} color={String(color)} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
