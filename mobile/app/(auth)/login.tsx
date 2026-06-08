import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Colors } from '../../constants/colors';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'E-posta ve şifre gerekli');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      await setToken(data.accessToken);
      setUser(data.user);
      const { registerForPushNotifications } = await import('../../services/pushNotifications');
      registerForPushNotifications();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string; code?: string };
      if (!axiosErr.response) {
        Alert.alert(
          'Sunucuya bağlanılamadı',
          'Uygulama şu an geliştirici bilgisayarındaki API\'ye ulaşamıyor. Geliştiricinin API ve tunnel\'ın açık olduğundan emin olun.',
        );
        return;
      }
      const msg = axiosErr.response?.data?.message;
      Alert.alert('Giriş başarısız', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Geçersiz e-posta veya şifre');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { data } = await authApi.oauth({
        provider: 'apple',
        providerId: credential.user,
        name: credential.fullName?.givenName ?? 'Kullanıcı',
        email: credential.email ?? undefined,
      });
      await setToken(data.accessToken);
      setUser(data.user);
      const { registerForPushNotifications } = await import('../../services/pushNotifications');
      registerForPushNotifications();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      if ((e as { code?: string }).code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple girişi başarısız');
      }
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert('Google Giriş', 'Google OAuth yapılandırması production deploy sırasında eklenecek.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Ionicons name="pricetag" size={48} color={Colors.primary} />
          <Text style={styles.appName}>Pintio</Text>
          <Text style={styles.tagline}>İndirimi yakala, kazan!</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordWrap}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Şifre"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryBtnText}>Giriş Yap</Text>}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.dividerLine} />
        </View>

        {Platform.OS === 'ios' ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleBtn}
            onPress={handleAppleLogin}
          />
        ) : null}

        <TouchableOpacity style={styles.oauthBtn} onPress={handleGoogleLogin}>
          <Ionicons name="logo-google" size={20} color={Colors.text} />
          <Text style={styles.oauthBtnText}>Google ile devam et</Text>
        </TouchableOpacity>

        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Hesap Oluştur</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.primary, marginTop: 8 },
  tagline: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 12,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 16, top: 14 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, color: Colors.textMuted, fontSize: 13 },
  appleBtn: { width: '100%', height: 48, marginBottom: 12 },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    marginBottom: 12,
  },
  oauthBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  outlineBtn: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '700' },
});
