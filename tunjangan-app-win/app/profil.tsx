import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, TextInput, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function ProfilScreen() {
  const router = useRouter();
  const [profil, setProfil]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Ganti password
  const [passLama, setPassLama]     = useState('');
  const [passBaru, setPassBaru]     = useState('');
  const [passKonfirm, setPassKonfirm] = useState('');
  const [savingPass, setSavingPass] = useState(false);
  const [showPassLama, setShowPassLama]   = useState(false);
  const [showPassBaru, setShowPassBaru]   = useState(false);
  const [showKonfirm, setShowKonfirm]     = useState(false);

  useEffect(() => { ambilProfil(); }, []);

  async function ambilProfil() {
    try {
      setLoading(true);
      const res = await api.get('/api/auth/profil');
      setProfil(res.data);
    } catch (err) {
      Alert.alert('Error', 'Gagal ambil profil');
    } finally {
      setLoading(false);
    }
  }

  async function gantiFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Izin galeri diperlukan');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (result.canceled) return;

    try {
      setUploadingFoto(true);
      const formData = new FormData();
      formData.append('foto', {
        uri:  result.assets[0].uri,
        type: 'image/jpeg',
        name: 'profil.jpg',
      } as any);

      const res = await api.post('/api/auth/upload-foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProfil(prev => ({ ...prev, foto_url: res.data.url }));
      toast('Foto profil berhasil diupdate');
    } catch (err) {
      Alert.alert('Gagal', 'Gagal upload foto');
    } finally {
      setUploadingFoto(false);
    }
  }

  async function gantiPassword() {
    if (!passLama || !passBaru || !passKonfirm)
      return Alert.alert('Error', 'Semua field wajib diisi');
    if (passBaru.length < 6)
      return Alert.alert('Error', 'Password baru minimal 6 karakter');
    if (passBaru !== passKonfirm)
      return Alert.alert('Error', 'Konfirmasi password tidak cocok');

    try {
      setSavingPass(true);
      await api.post('/api/auth/ganti-password', {
        password_lama: passLama,
        password_baru: passBaru,
      });
      Alert.alert('Berhasil! ✅', 'Password berhasil diubah');
      setPassLama(''); setPassBaru(''); setPassKonfirm('');
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setSavingPass(false);
    }
  }

  function inisial(nama) {
    return (nama || '').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  }

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#4361ee" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profil Saya</Text>
      </View>

      <ScrollView 
  contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
  keyboardShouldPersistTaps="handled"
>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={gantiFoto} disabled={uploadingFoto}>
            {profil?.foto_url ? (
              <Image source={{ uri: profil.foto_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInisial}>{inisial(profil?.nama)}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingFoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ color: '#fff', fontSize: 12 }}>📷</Text>
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarNama}>{profil?.nama}</Text>
          <Text style={styles.avatarRole}>{profil?.role?.toUpperCase()}</Text>
        </View>

        {/* Info (semua di-lock) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Informasi Akun</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Karyawan</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>{profil?.employee_id || '-'}</Text>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>{profil?.nama || '-'}</Text>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>{profil?.email || '-'}</Text>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>No. WhatsApp</Text>
            <View style={styles.infoValueBox}>
              <Text style={styles.infoValue}>{profil?.no_wa || '-'}</Text>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          </View>

          <Text style={styles.lockNote}>* Data dikunci, hubungi admin untuk mengubah</Text>
        </View>

        {/* Ganti Password */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔑 Ganti Password</Text>

          <Text style={styles.inputLabel}>Password Lama</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={passLama}
              onChangeText={setPassLama}
              secureTextEntry={!showPassLama}
              placeholder="Password saat ini"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity onPress={() => setShowPassLama(!showPassLama)} style={styles.eyeBtn}>
              <Text>{showPassLama ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Password Baru</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={passBaru}
              onChangeText={setPassBaru}
              secureTextEntry={!showPassBaru}
              placeholder="Minimal 6 karakter"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity onPress={() => setShowPassBaru(!showPassBaru)} style={styles.eyeBtn}>
              <Text>{showPassBaru ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={passKonfirm}
              onChangeText={setPassKonfirm}
              secureTextEntry={!showKonfirm}
              placeholder="Ulangi password baru"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity onPress={() => setShowKonfirm(!showKonfirm)} style={styles.eyeBtn}>
              <Text>{showKonfirm ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingPass && styles.saveBtnDisabled]}
            onPress={gantiPassword}
            disabled={savingPass}
          >
            {savingPass
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>🔑 Simpan Password Baru</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

function toast(msg) {
  Alert.alert('✅', msg);
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f0f4f8' },
  header:            { padding: 20, paddingTop: 50, backgroundColor: '#4361ee' },
  back:              { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  title:             { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  avatarSection:     { alignItems: 'center', paddingVertical: 24 },
  avatar:            { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#4361ee' },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#4361ee', alignItems: 'center', justifyContent: 'center' },
  avatarInisial:     { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  avatarEditBadge:   { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4361ee', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarNama:        { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e', marginTop: 10 },
  avatarRole:        { fontSize: 12, color: '#888', marginTop: 3, letterSpacing: 1 },
  card:              { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitle:         { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 14 },
  infoRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  infoLabel:         { fontSize: 13, color: '#888', flex: 1 },
  infoValueBox:      { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 2, justifyContent: 'flex-end' },
  infoValue:         { fontSize: 14, fontWeight: '500', color: '#1a1a2e', textAlign: 'right' },
  lockIcon:          { fontSize: 12 },
  lockNote:          { fontSize: 11, color: '#aaa', marginTop: 10, fontStyle: 'italic' },
  inputLabel:        { fontSize: 13, color: '#555', marginBottom: 6, marginTop: 10 },
  passRow:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input:             { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 14, color: '#1a1a2e', backgroundColor: '#fafafa' },
  eyeBtn:            { padding: 10 },
  saveBtn:           { backgroundColor: '#4361ee', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled:   { backgroundColor: '#a0aec0' },
  saveBtnText:       { color: '#fff', fontSize: 15, fontWeight: '600' },
});