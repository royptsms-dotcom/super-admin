import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);

  async function handleLogin() {
    if (!identifier.trim() || !password)
      return Alert.alert('Error', 'ID/Email dan password wajib diisi');

    try {
      setLoading(true);
      const res = await api.post('/api/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));

      if (res.data.user.role === 'admin') {
        router.replace('/rekap');
      } else {
        router.replace('/home');
      }
    } catch (err) {
      Alert.alert('Login Gagal', err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>💼</Text>
          <Text style={styles.logoTitle}>E-SMS</Text>
          <Text style={styles.logoSub}>Monitoring Karyawan</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login</Text>

          <Text style={styles.inputLabel}>ID Karyawan atau Email</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="Contoh: 001 atau nama@email.com"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="Password"
              placeholderTextColor="#aaa"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Masuk</Text>
            }
          </TouchableOpacity>

          <Text style={styles.hint}>
            💡 Gunakan ID karyawan (misal: 001) atau email untuk login
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f0f4f8', justifyContent: 'center', padding: 24, paddingTop: 80 },
  logoBox:         { alignItems: 'center', marginBottom: 32 },
  logoIcon:        { fontSize: 52, marginBottom: 10 },
  logoTitle:       { fontSize: 26, fontWeight: 'bold', color: '#1a1a2e' },
  logoSub:         { fontSize: 14, color: '#888', marginTop: 4 },
  card:            { backgroundColor: '#fff', borderRadius: 16, padding: 22, elevation: 3 },
  cardTitle:       { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 18 },
  inputLabel:      { fontSize: 13, color: '#555', marginBottom: 6 },
  input:           { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 13, fontSize: 15, color: '#1a1a2e', backgroundColor: '#fafafa', marginBottom: 14 },
  passRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  eyeBtn:          { padding: 8 },
  loginBtn:        { backgroundColor: '#4361ee', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  loginBtnDisabled:{ backgroundColor: '#a0aec0' },
  loginBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint:            { fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 14 },
});