import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, TextInput, Image, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import api from '../services/api';

interface UserProfile {
  id: string;
  nama: string;
  email: string;
  role: string;
  no_wa: string;
  employee_id: string;
  foto_url: string;
  job?: string;
}

interface AppConfig {
  appNama?: string;
  appIcon?: string;
  appIconType?: string;
}

export default function ProfilScreen() {
  const router = useRouter();
  const [profil, setProfil]         = useState<UserProfile | null>(null);
  const [loading, setLoading]       = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [passLama, setPassLama]     = useState('');
  const [passBaru, setPassBaru]     = useState('');
  const [passKonfirm, setPassKonfirm] = useState('');
  const [savingPass, setSavingPass] = useState(false);
  const [showPassLama, setShowPassLama]   = useState(false);
  const [showPassBaru, setShowPassBaru]   = useState(false);
  const [showKonfirm, setShowKonfirm]     = useState(false);
  
  const [showNameTag, setShowNameTag] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

  useEffect(() => { 
    ambilProfil(); 
    ambilConfig();
  }, []);

  async function ambilConfig() {
    try {
      const res = await api.get('/api/master/config');
      setAppConfig(res.data);
    } catch {}
  }

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

      if (profil) {
        setProfil({ ...profil, foto_url: res.data.url });
      }
      Alert.alert('Sukses', 'Foto profil berhasil diupdate');
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
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setSavingPass(false);
    }
  }

  function inisial(nama: string | undefined) {
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
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
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

        {/* Preview Name Tag */}
        <View style={[styles.card, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe', borderWidth: 1 }]}>
          <Text style={[styles.cardTitle, { marginBottom: 4 }]}>🎫 Name Tag Digital</Text>
          <Text style={{ fontSize: 11, color: '#6366f1', marginBottom: 12 }}>Preview kartu identitas Anda</Text>
          <TouchableOpacity style={styles.previewBtn} onPress={() => setShowNameTag(true)}>
            <Text style={styles.previewBtnText}>👁 Lihat Name Tag</Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Informasi Akun</Text>
          <InfoItem label="ID Karyawan" value={profil?.employee_id} last={false} />
          <InfoItem label="Nama" value={profil?.nama} last={false} />
          <InfoItem label="Jabatan" value={profil?.job} last={false} />
          <InfoItem label="Email" value={profil?.email} last={false} />
          <InfoItem label="No. WhatsApp" value={profil?.no_wa} last={true} />
          <Text style={styles.lockNote}>* Data dikunci, hubungi admin untuk mengubah</Text>
        </View>

        {/* Ganti Password */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔑 Ganti Password</Text>
          <PasswordInput label="Password Lama" value={passLama} onChange={setPassLama} show={showPassLama} setShow={setShowPassLama} />
          <PasswordInput label="Password Baru" value={passBaru} onChange={setPassBaru} show={showPassBaru} setShow={setShowPassBaru} />
          <PasswordInput label="Konfirmasi Password Baru" value={passKonfirm} onChange={setPassKonfirm} show={showKonfirm} setShow={setShowKonfirm} />
          
          <TouchableOpacity style={[styles.saveBtn, savingPass && styles.saveBtnDisabled]} onPress={gantiPassword} disabled={savingPass}>
            {savingPass ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan Password Baru</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL NAME TAG */}
      <Modal visible={showNameTag} transparent animationType="fade" onRequestClose={() => setShowNameTag(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preview Name Tag</Text>
              <TouchableOpacity onPress={() => setShowNameTag(false)}><Text style={{fontSize:24, color:'#888'}}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ alignItems: 'center', paddingVertical: 30 }}>
              <View style={styles.tagCard}>
                <View style={styles.tagHeader}>
                  <View style={styles.tagLogoBox}><Text style={{ fontSize: 24 }}>{appConfig?.appIcon || '💼'}</Text></View>
                  <Text style={styles.tagCompanyName}>{appConfig?.appNama?.toUpperCase() || 'PERUSAHAAN'}</Text>
                </View>
                <View style={styles.tagPhotoBox}>
                  <Image source={{ uri: profil?.foto_url || 'https://via.placeholder.com/150' }} style={styles.tagPhoto} />
                  <View style={styles.tagAccentMark} />
                </View>
                <View style={styles.tagInfo}>
                  <Text style={styles.tagName}>{profil?.nama}</Text>
                  <View style={styles.tagJobBadge}><Text style={styles.tagJobText}>{(profil?.job || 'STAF').toUpperCase()}</Text></View>
                </View>
                <View style={styles.tagFooter}>
                  <View>
                    <Text style={styles.tagIDLabel}>Employee ID</Text>
                    <Text style={styles.tagIDValue}>{profil?.employee_id || '-'}</Text>
                  </View>
                  <View style={styles.tagGraphic} />
                </View>
              </View>
              <Text style={styles.tagHint}>* Hubungi admin jika data tidak sesuai</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoItem({ label, value, last }: { label: string, value: string | undefined, last: boolean }) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueBox}>
        <Text style={styles.infoValue}>{value || '-'}</Text>
        <Text style={{fontSize:12}}>🔒</Text>
      </View>
    </View>
  );
}

function PasswordInput({ label, value, onChange, show, setShow }: { label: string, value: string, onChange: (v: string) => void, show: boolean, setShow: (s: boolean) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.passRow}>
        <TextInput style={[styles.input, { flex: 1 }]} value={value} onChangeText={onChange} secureTextEntry={!show} placeholderTextColor="#aaa" />
        <TouchableOpacity onPress={() => setShow(!show)} style={{ padding: 10 }}>
          <Text>{show ? '🙈' : '👁'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f8fafc' },
  header:            { padding: 20, paddingTop: 60, backgroundColor: '#4361ee', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  back:              { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 },
  title:             { color: '#fff', fontSize: 22, fontWeight: '800' },
  avatarSection:     { alignItems: 'center', paddingVertical: 20 },
  avatar:            { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#fff' },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#4361ee', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff' },
  avatarInisial:     { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  avatarEditBadge:   { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4361ee', borderRadius: 15, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarNama:        { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 12 },
  avatarRole:        { fontSize: 11, color: '#64748b', marginTop: 2, letterSpacing: 1.5, fontWeight: '700' },
  card:              { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle:         { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  infoRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  infoLabel:         { fontSize: 13, color: '#64748b' },
  infoValueBox:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoValue:         { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  lockNote:          { fontSize: 11, color: '#94a3b8', marginTop: 12, fontStyle: 'italic' },
  inputLabel:        { fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: '600' },
  passRow:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input:             { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc' },
  saveBtn:           { backgroundColor: '#4361ee', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnDisabled:   { backgroundColor: '#cbd5e1' },
  saveBtnText:       { color: '#fff', fontSize: 14, fontWeight: '700' },
  previewBtn:        { backgroundColor: '#4361ee', borderRadius: 10, padding: 12, alignItems: 'center' },
  previewBtnText:    { color: '#fff', fontWeight: 'bold' },
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent:      { backgroundColor: '#fff', borderRadius: 24, width: '100%', maxWidth: 340, overflow: 'hidden' },
  modalHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  modalTitle:        { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  tagCard:           { width: 260, height: 400, backgroundColor: '#fff', borderRadius: 24, padding: 20, alignItems: 'center', elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  tagHeader:         { alignItems: 'center', marginBottom: 20 },
  tagLogoBox:        { width: 50, height: 50, backgroundColor: '#f8fafc', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  tagCompanyName:    { fontSize: 10, fontWeight: '900', color: '#4361ee', letterSpacing: 1.2 },
  tagPhotoBox:       { position: 'relative', marginBottom: 20 },
  tagPhoto:          { width: 130, height: 130, borderRadius: 20, borderWidth: 3, borderColor: '#4361ee' },
  tagAccentMark:     { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#4361ee', width: 28, height: 28, borderRadius: 10, borderWidth: 3, borderColor: '#fff' },
  tagInfo:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagName:           { fontSize: 18, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 6 },
  tagJobBadge:       { backgroundColor: '#eef2ff', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8 },
  tagJobText:        { fontSize: 10, fontWeight: '800', color: '#4361ee' },
  tagFooter:         { width: '100%', paddingTop: 15, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagIDLabel:        { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' },
  tagIDValue:        { fontSize: 14, fontWeight: '800', color: '#4361ee' },
  tagGraphic:        { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2 },
  tagHint:           { fontSize: 11, color: '#94a3b8', marginTop: 24, fontStyle: 'italic' }
});