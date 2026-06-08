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
import { Colors } from '../../constants/colors';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Hata', 'Tüm alanları doldurun');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }
    if (password.length < 8 || !/\d/.test(password)) {
      Alert.alert('Hata', 'Şifre en az 8 karakter ve bir rakam içermeli');
      return;
    }
    if (!accepted) {
      Alert.alert('Hata', 'Kullanım şartlarını kabul etmelisiniz');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.register({ name, email, password });
      await setToken(data.accessToken);
      setUser(data.user);
      const { registerForPushNotifications } = await import('../../services/pushNotifications');
      registerForPushNotifications();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      if (!axiosErr.response) {
        Alert.alert(
          'Sunucuya bağlanılamadı',
          'Uygulama şu an geliştirici bilgisayarındaki API\'ye ulaşamıyor. Geliştiricinin API ve tunnel\'ın açık olduğundan emin olun.',
        );
        return;
      }
      const msg = axiosErr.response?.data?.message;
      Alert.alert('Kayıt başarısız', Array.isArray(msg) ? msg.join('\n') : msg ?? 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Hesap Oluştur</Text>
        <Text style={styles.subtitle}>Gerçek indirimleri kaçırmamak için hesap aç</Text>

        <TextInput style={styles.input} placeholder="Ad Soyad" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="E-posta" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <View style={styles.passwordWrap}>
          <TextInput style={[styles.input, styles.passwordInput]} placeholder="Şifre" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TextInput style={styles.input} placeholder="Şifre Tekrar" placeholderTextColor={Colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />

        <TouchableOpacity style={styles.checkRow} onPress={() => setAccepted(!accepted)}>
          <Ionicons name={accepted ? 'checkbox' : 'square-outline'} size={22} color={Colors.primary} />
          <Text style={styles.checkText}>Kullanım şartlarını ve gizlilik politikasını okudum, kabul ediyorum</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryBtn, !accepted && styles.primaryBtnDisabled]}
          onPress={handleRegister}
          disabled={loading || !accepted}
        >
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryBtnText}>Kayıt Ol</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten hesabın var mı? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text style={styles.link}>Giriş yap</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: 24 },
  back: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 24 },
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
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginVertical: 12 },
  checkText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: Colors.textSecondary },
  link: { color: Colors.primary, fontWeight: '700' },
});
