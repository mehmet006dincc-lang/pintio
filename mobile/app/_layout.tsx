import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" options={{ title: '' }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: true,
            title: 'Ürün Detay',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.white },
            headerTitleStyle: { fontWeight: '700', color: Colors.text },
            headerShadowVisible: false,
            headerBackTitleVisible: false,
            headerBackTitle: 'Geri',
          }}
        />
      </Stack>
    </>
  );
}
