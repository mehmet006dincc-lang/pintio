import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{ marginLeft: Platform.OS === 'ios' ? 0 : 8 }}
    >
      <Ionicons
        name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
        size={Platform.OS === 'ios' ? 28 : 24}
        color={Colors.primary}
      />
    </TouchableOpacity>
  );
}

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerLeft: () => <BackButton />,
        headerBackVisible: false,
        headerTintColor: Colors.primary,
        headerStyle: { backgroundColor: Colors.white },
        headerTitleStyle: { fontWeight: '700', color: Colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="info" options={{ title: 'Profil Bilgilerim' }} />
      <Stack.Screen name="track" options={{ title: 'URL ile Takip' }} />
      <Stack.Screen name="interests" options={{ title: 'İlgi Alanlarım' }} />
      <Stack.Screen name="notifications" options={{ title: 'Bildirim Ayarları' }} />
      <Stack.Screen name="help" options={{ title: 'Yardım & Destek' }} />
      <Stack.Screen name="about" options={{ title: 'Hakkımızda' }} />
    </Stack>
  );
}
