import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../theme';

export default function RootLayout() {
  const { c, dark } = useTheme();
  const hydrated = useAppStore((s) => s.hydrated);

  const navTheme = {
    ...(dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(dark ? DarkTheme : DefaultTheme).colors,
      primary: c.primary,
      background: c.bg,
      card: c.surface,
      text: c.text,
      border: c.border,
      notification: c.accent,
    },
  };

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: c.primary,
          headerTitleStyle: { color: c.text, fontWeight: '700' },
          headerStyle: { backgroundColor: c.bg },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="exercicio/[id]" options={{ title: 'Exercício' }} />
        <Stack.Screen name="equipamentos" options={{ title: 'Meu kit', presentation: 'modal' }} />
        <Stack.Screen name="sequencia" options={{ title: 'Sua sequência' }} />
        <Stack.Screen name="adicionar" options={{ title: 'Adicionar exercício', presentation: 'modal' }} />
        <Stack.Screen name="rotinas/[id]" options={{ title: 'Rotina' }} />
        <Stack.Screen name="compartilhar/[id]" options={{ title: 'Compartilhar rotina', presentation: 'modal' }} />
        <Stack.Screen name="importar" options={{ title: 'Rotina recebida' }} />
        <Stack.Screen name="player" options={{ headerShown: false, gestureEnabled: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="avaliacao/[id]" options={{ title: 'Avaliação' }} />
        <Stack.Screen name="ajustes" options={{ title: 'Ajustes' }} />
        <Stack.Screen name="validacao" options={{ title: 'Teste com usuários' }} />
        <Stack.Screen name="sobre" options={{ title: 'Sobre e segurança' }} />
      </Stack>
    </ThemeProvider>
  );
}
