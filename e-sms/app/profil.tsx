import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, TextInput, Image, Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // SISTEM 2: SCAN QR GRUP
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning]     = useState(false);
  const [scannedGroupId, setScannedGroupId] = useState<string | null>(null);

  useEffect(() => { 
    ambilProfil(); 
    ambilConfig();
    ambilGrupTersimpan();
  }, []);

  async function ambilGrupTersimpan() {
    const saved = await AsyncStorage.getItem('forward_wa_group_id');
    if (saved) setScannedGroupId(saved);
  }

  async function handleBarCodeScanned({ data }: any) {
    setIsScanning(false);
    setScannedGroupId(data);
    await AsyncStorage.setItem('forward_wa_group_id', data);
    Alert.alert('Berhasil! ✅', `Tujuan forward disetel ke: ${data}`);
  }

  async function ambilConfig() {
    try {
      const res = await api.get('/master/config');
      setAppConfig(res.data);
    } catch {}
  }

  async function ambilProfil() {
    try {
      setLoading(true);
      const res = await api.get('/auth/profil');
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
                : <Feather name="camera" size={16} color="#fff" />
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarNama}>{profil?.nama}</Text>
          <Text style={styles.avatarRole}>{profil?.role?.toUpperCase()}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe', borderWidth: 1 }]}>
          <Text style={[styles.cardTitle, { marginBottom: 4 }]}>🎫 Name Tag Digital</Text>
          <Text style={{ fontSize: 11, color: '#6366f1', marginBottom: 12 }}>Preview kartu identitas Anda</Text>
          <TouchableOpacity style={styles.previewBtn} onPress={() => setShowNameTag(true)}>
            <Text style={styles.previewBtnText}>👁 Lihat Name Tag</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛰️ WhatsApp Forwarding</Text>
          <Text style={{ fontSize: 11, color: '#8b96a5', marginBottom: 12 }}>Tentukan grup tujuan forward laporan Anda</Text>
          
          {scannedGroupId ? (
            <View style={{ backgroundColor: '#f0fdf4', borderLeftWidth: 4, borderLeftColor: '#2ECC40', padding: 15, borderRadius: 12 }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#166534', fontWeight: '900', fontSize: 12 }}>TARGET AKTIF ✅</Text>
                  <TouchableOpacity onPress={() => setIsScanning(true)}>
                    <Text style={{ color: '#4680ff', fontWeight: 'bold', fontSize: 11 }}>Ganti Grup</Text>
                  </TouchableOpacity>
               </View>
               <Text style={{ color: '#1a1a2e', fontSize: 13, marginTop: 4, fontWeight: '700' }} numberOfLines={1}>{scannedGroupId}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.scanBtn} onPress={() => setIsScanning(true)}>
              <MaterialIcons name="qr-code-scanner" size={24} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 10 }}>Scan QR Dashboard Grup</Text>
            </TouchableOpacity>
          )}
          <Text style={{ fontSize: 10, color: '#adb5bd', marginTop: 10, fontStyle: 'italic' }}>* Scan di menu Dashboard "Mapping Grup WA"</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Informasi Akun</Text>
          <InfoItem label="ID Karyawan" value={profil?.employee_id} last={false} />
          <InfoItem label="Nama" value={profil?.nama} last={false} />
          <InfoItem label="Jabatan" value={profil?.job} last={false} />
          <InfoItem label="Email" value={profil?.email} last={false} />
          <InfoItem label="No. WhatsApp" value={profil?.no_wa} last={true} />
          <Text style={styles.lockNote}>* Data dikunci, hubungi admin untuk mengubah</Text>
        </View>

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

      <Modal visible={isScanning} animationType="slide" transparent={false}>
          <View style={styles.scannerOverlay}>
            <CameraView
              style={styles.fullCamera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            >
              <View style={styles.scanFrameContainer}>
                 <View style={styles.scanFrame}></View>
                 <Text style={styles.scanText}>Arahkan ke QR Mapping di Dashboard</Text>
                 <TouchableOpacity style={styles.closeScan} onPress={() => setIsScanning(false)}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>BATAL</Text>
                 </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        </Modal>

      <Modal visible={showNameTag} transparent animationType="fade" onRequestClose={() => setShowNameTag(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preview Name Tag</Text>
              <TouchableOpacity onPress={() => setShowNameTag(false)}>
                <Feather name="x" size={24} color="#8b96a5" />
              </TouchableOpacity>
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
        <Feather name="lock" size={12} color="#8b96a5" />
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
        <TouchableOpacity onPress={() => setShow(!show)} style={{ padding: 10, position: 'absolute', right: 5 }}>
          <Feather name={show ? "eye-off" : "eye"} size={20} color="#8b96a5" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f9fc' },
  header: { 
    padding: 24, 
    paddingTop: 64, 
    paddingBottom: 40,
    backgroundColor: '#4680ff', 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40,
    elevation: 10,
    shadowColor: '#4680ff',
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  back: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  avatarSection: { alignItems: 'center', marginTop: -30, marginBottom: 20 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 5, borderColor: '#fff' },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#4680ff', alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: '#fff' },
  avatarInisial: { color: '#fff', fontSize: 40, fontWeight: '900' },
  avatarEditBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#4680ff', borderRadius: 15, width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarNama: { fontSize: 22, fontWeight: '900', color: '#1a1a2e', marginTop: 12 },
  avatarRole: { fontSize: 11, color: '#8b96a5', marginTop: 2, letterSpacing: 2, fontWeight: '800', textTransform: 'uppercase' },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    elevation: 8,
    shadowColor: '#30475e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '900', color: '#1a1a2e', marginBottom: 18, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#f0f2f5' },
  infoLabel: { fontSize: 13, color: '#8b96a5', fontWeight: '600' },
  infoValueBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1a1a2e' },
  lockNote: { fontSize: 11, color: '#adb5bd', marginTop: 15, fontStyle: 'italic', textAlign: 'center' },
  inputLabel: { fontSize: 12, color: '#8b96a5', marginBottom: 8, fontWeight: '800', textTransform: 'uppercase' },
  passRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, borderWidth: 2, borderColor: '#f0f2f5', borderRadius: 15, padding: 14, fontSize: 15, color: '#1a1a2e', backgroundColor: '#fafbfc' },
  saveBtn: { backgroundColor: '#4680ff', borderRadius: 18, padding: 18, alignItems: 'center', marginTop: 16, elevation: 5, shadowColor: '#4680ff', shadowOpacity: 0.3 },
  saveBtnDisabled: { backgroundColor: '#cbd5e1' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  previewBtn: { backgroundColor: '#4680ff', borderRadius: 15, padding: 15, alignItems: 'center', elevation: 4 },
  previewBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26, 26, 46, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 32, width: '100%', maxWidth: 350, overflow: 'hidden', elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderColor: '#f0f2f5' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a2e' },
  tagCard: { width: 270, height: 410, backgroundColor: '#fff', borderRadius: 28, padding: 24, alignItems: 'center', elevation: 15, shadowColor: '#000', shadowOpacity: 0.1, borderWidth: 1, borderColor: '#f0f2f5' },
  tagHeader: { alignItems: 'center', marginBottom: 20 },
  tagLogoBox: { width: 54, height: 54, backgroundColor: '#f8f9fa', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#f0f2f5' },
  tagCompanyName: { fontSize: 11, fontWeight: '900', color: '#4680ff', letterSpacing: 1.5 },
  tagPhotoBox: { position: 'relative', marginBottom: 22 },
  tagPhoto: { width: 140, height: 140, borderRadius: 24, borderWidth: 4, borderColor: '#4680ff' },
  tagAccentMark: { position: 'absolute', bottom: -6, right: -6, backgroundColor: '#4680ff', width: 30, height: 30, borderRadius: 10, borderWidth: 4, borderColor: '#fff' },
  tagInfo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagName: { fontSize: 20, fontWeight: '900', color: '#1a1a2e', textAlign: 'center', marginBottom: 8 },
  tagJobBadge: { backgroundColor: '#eef2ff', paddingVertical: 5, paddingHorizontal: 15, borderRadius: 10 },
  tagJobText: { fontSize: 11, fontWeight: '900', color: '#4680ff', textTransform: 'uppercase' },
  tagFooter: { width: '100%', paddingTop: 18, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#e1e5eb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagIDLabel: { fontSize: 8, color: '#8b96a5', textTransform: 'uppercase', fontWeight: '800' },
  tagIDValue: { fontSize: 15, fontWeight: '900', color: '#4680ff' },
  tagGraphic: { width: 45, height: 5, backgroundColor: '#f0f2f5', borderRadius: 3 },
  tagHint: { fontSize: 11, color: '#adb5bd', marginTop: 24, fontStyle: 'italic' }
});