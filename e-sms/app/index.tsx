import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { Feather } from '@expo/vector-icons';

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
      
      // MENGGUNAKAN SERVICE API (SUDAH TERPUSAT)
      const response = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      const resData = response.data;

      await AsyncStorage.setItem('token', resData.token);
      await AsyncStorage.setItem('user', JSON.stringify(resData.user));

      if (resData.user.role === 'admin') {
        router.replace('/rekap');
      } else {
        router.replace('/home');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Diagnosa Error', `Pesan: ${err.message}\nIP PC: 10.197.114.154\nPastikan PC & HP satu WiFi.`);
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Feather name="user" size={14} color="#4680ff" />
            <Text style={[styles.inputLabel, { marginBottom: 0 }]}>ID Karyawan atau Email</Text>
          </View>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="Contoh: 001 atau nama@email.com"
            placeholderTextColor="#adb5bd"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Feather name="lock" size={14} color="#4680ff" />
            <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Password</Text>
          </View>
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
              <Feather name={showPass ? "eye-off" : "eye"} size={20} color="#8b96a5" />
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
          <Text style={{ textAlign: 'center', fontSize: 10, color: '#ff4757', marginTop: 10 }}>
            Target Server: {api.defaults.baseURL}
          </Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    padding: 24 
  },
  logoBox: { 
    alignItems: 'center', 
    marginBottom: 40 
  },
  logoIcon: { 
    fontSize: 64, 
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  logoTitle: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#1a1a2e',
    letterSpacing: 2
  },
  logoSub: { 
    fontSize: 14, 
    color: '#8b96a5', 
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 30, 
    padding: 28, 
    elevation: 15, 
    shadowColor: '#4680ff',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#f0f2f5'
  },
  cardTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#1a1a2e', 
    marginBottom: 24,
    textAlign: 'center'
  },
  inputLabel: { 
    fontSize: 12, 
    color: '#8b96a5', 
    marginBottom: 8, 
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  input: { 
    borderWidth: 2, 
    borderColor: '#f0f2f5', 
    borderRadius: 15, 
    padding: 15, 
    fontSize: 16, 
    color: '#1a1a2e', 
    backgroundColor: '#fafbfc', 
    marginBottom: 18 
  },
  passRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    position: 'relative',
    marginBottom: 18 
  },
  eyeBtn: { 
    position: 'absolute', 
    right: 15, 
    top: 15,
    padding: 4 
  },
  loginBtn: { 
    backgroundColor: '#4680ff', 
    borderRadius: 18, 
    padding: 18, 
    alignItems: 'center', 
    marginTop: 10,
    elevation: 8,
    shadowColor: '#4680ff',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  loginBtnDisabled: { 
    backgroundColor: '#cbd5e0' 
  },
  loginBtnText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '900',
    letterSpacing: 1
  },
  hint: { 
    fontSize: 11, 
    color: '#adb5bd', 
    textAlign: 'center', 
    marginTop: 20,
    lineHeight: 16
  },
});