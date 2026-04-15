import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function LemburScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [sisaWaktu, setSisaWaktu] = useState<any>(null);
  const [targetTime, setTargetTime] = useState<any>(null);
  const [foto, setFoto] = useState<any>(null);
  const [lemburId, setLemburId] = useState<any>(null);
  const [waktuFoto, setWaktuFoto] = useState<any>(null);
  const [location, setLocation] = useState<any>(null);
  const [loadingFoto, setLoadingFoto] = useState(false);

  const [daftarRS, setDaftarRS] = useState<any[]>([]);
  const [daftarUsers, setDaftarUsers] = useState<any[]>([]);
  const [selectedRS, setSelectedRS] = useState<any>(null);
  const [keterangan, setKeterangan] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<any[]>([]);
  const [cariRS, setCariRS] = useState('');
  const [showRS, setShowRS]           = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    ambilMasterData();
    ambilLokasi();
    cekDraftDipilih();
    startInitialTimer();
  }, []);

  // Logika Timer Timeout 10 Menit
  useEffect(() => {
    // Timer hanya berjalan di Step 1. Setelah foto tersimpan (Step 2), timer berhenti.
    if (step === 2 || !targetTime) return;

    const timer = setInterval(() => {
      const kini = Date.now();
      const selisih = Math.max(0, Math.floor((targetTime - kini) / 1000));
      setSisaWaktu(selisih);

      if (selisih <= 0) {
        clearInterval(timer);
        Alert.alert(
          'Waktu Entri Habis! ⏱️',
          'Batas waktu 10 menit untuk pengambilan foto telah berakhir. Silakan mulai ulang laporan lembur Anda.',
          [{ text: 'OK', onPress: () => router.replace('/home') }]
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, step]);

  async function startInitialTimer() {
    // Durasi default 10 menit sesuai permintaan
    const DEFAULT_TIMEOUT = 10;
    const durasiMs = DEFAULT_TIMEOUT * 60 * 1000;

    // Set target waktu absolut (agar tetap jalan meski buka kamera)
    const tTime = Date.now() + durasiMs;
    setTargetTime(tTime);
    setSisaWaktu(DEFAULT_TIMEOUT * 60);

    // Coba ambil durasi timeout dari server jika ada konfigurasi khusus
    try {
      const res = await api.get(`/master/config?t=${Date.now()}`);
      if (res.data.lembur_timeout) {
        const serverMenit = parseInt(res.data.lembur_timeout);
        setTargetTime(Date.now() + (serverMenit * 60 * 1000));
        setSisaWaktu(serverMenit * 60);
      }
    } catch {
      // Tetap pakai 10 menit jika gagal
    }
  }

  function formatSisaWaktu(detik: number) {
    const m = Math.floor(detik / 60);
    const s = detik % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function cekDraftDipilih() {
    try {
      const raw = await AsyncStorage.getItem('selected_draft');
      if (raw) {
        const draft = JSON.parse(raw);
        setLemburId(draft.id);
        setWaktuFoto(draft.waktu_foto);
        setFoto({ uri: draft.foto_url });
        setStep(2);
        await AsyncStorage.removeItem('selected_draft');
      }
    } catch (err) {
      console.log('Tidak ada draft dipilih');
    }
  }

  async function ambilLokasi() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation(loc.coords);
  }

  async function ambilMasterData() {
    try {
      const [rsRes, usersRes] = await Promise.all([
        api.get('/master/rs'),
        api.get('/master/users'),
      ]);
      setDaftarRS(rsRes.data);
      setDaftarUsers(usersRes.data);
    } catch (err) {
      console.log('Gagal ambil master data');
    }
  }

  async function ambilFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Izin kamera diperlukan');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      setFoto(result.assets[0]);
      setWaktuFoto(new Date().toISOString());
    }
  }

  async function uploadFoto() {
    if (!foto) return Alert.alert('Error', 'Ambil foto dulu');
    if (!selectedRS) return Alert.alert('Error', 'Pilih lokasi RS dulu');
    if (!location) return Alert.alert('Error', 'GPS belum didapat');

    try {
      setLoadingFoto(true);
      const formData = new FormData();
      formData.append('foto', { uri: foto.uri, type: 'image/jpeg', name: `lembur_${Date.now()}.jpg` } as any);
      formData.append('rs_id', selectedRS.id);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('waktu_foto', waktuFoto as any);

      const res = await api.post('/lembur/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setLemburId(res.data.lembur_id);
      setStep(2); // Timer akan BERHENTI di sini
    } catch (err: any) {
      Alert.alert('Gagal Upload', err.response?.data?.error || err.message);
    } finally {
      setLoadingFoto(false);
    }
  }

  async function handleSubmit() {
    if (!keterangan.trim()) return Alert.alert('Error', 'Keterangan wajib diisi');

    try {
      setLoadingSubmit(true);
      const waktuSelesai = new Date().toISOString();

      // Ambil ID Grup Global (Sistem 2)
      const targetGroupId = await AsyncStorage.getItem('forward_wa_group_id');

      await api.post('/lembur/submit', {
        lembur_id:       lemburId,
        waktu_mulai:     waktuFoto,
        waktu_selesai:   waktuSelesai,
        keterangan,
        tagged_user_ids: taggedUsers.map(u => u.id),
        wa_group_id:     targetGroupId,
      });

      Alert.alert('Berhasil! 🎉', 'Laporan lembur sudah dikirim ke grup WA', [
        { text: 'OK', onPress: () => router.replace('/home') }
      ]);
    } catch (err: any) {
      Alert.alert('Gagal', err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoadingSubmit(false);
    }
  }

  function toggleTag(user: any) {
    setTaggedUsers((prev: any[]) =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  }

  function formatWaktu(iso: any) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit'
    });
  }

  const rsSorted = daftarRS.filter(rs =>
    rs.nama_rs.toLowerCase().includes(cariRS.toLowerCase())
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View style={styles.header}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Feather name="chevron-left" size={28} color="#fff" />
              <Text style={styles.backText}>Kembali</Text>
            </TouchableOpacity>

            {sisaWaktu !== null && step === 1 && (
              <View style={[styles.timerBadge, sisaWaktu < 60 && styles.timerDanger]}>
                <MaterialIcons name="timer" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.timerText}>{formatSisaWaktu(sisaWaktu)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>Input Laporan Lembur</Text>
          <View style={styles.headerSub}>
            <Text style={styles.stepLabel}>
              {step === 1 ? 'Langkah 1: Wajib Foto & Lokasi' : 'Langkah 2: Selesaikan Detail'}
            </Text>
          </View>
        </View>

        {/* STEP 1 */}
        {step === 1 && (
          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.labelRow}>
                <Feather name="map" size={18} color="#4680ff" style={{ marginRight: 8 }} />
                <Text style={styles.label}>Titik Lokasi RS</Text>
              </View>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setShowRS(!showRS)} activeOpacity={0.7}>
                <Text style={selectedRS ? styles.selectText : styles.selectPlaceholder}>
                  {selectedRS ? selectedRS.nama_rs : 'Ketuk untuk mencari rumah sakit...'}
                </Text>
                <Feather name={showRS ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
              </TouchableOpacity>

              {showRS && (
                <View style={styles.dropdown}>
                  <View style={styles.searchBox}>
                    <Feather name="search" size={16} color="#aaa" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Ketik nama RS..."
                      value={cariRS}
                      onChangeText={setCariRS}
                      autoFocus
                    />
                  </View>
                  <View style={{ maxHeight: 200 }}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="always">
                      {rsSorted.map(item => (
                        <TouchableOpacity key={item.id} style={styles.rsItem}
                          onPress={() => { setSelectedRS(item); setShowRS(false); setCariRS(''); }}>
                          <Text style={styles.rsNama}>{item.nama_rs}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.labelRow}>
                <Feather name="map-pin" size={18} color="#4680ff" style={{ marginRight: 8 }} />
                <Text style={styles.label}>Koordinat Akurat</Text>
              </View>
              {location
                ? (
                  <View style={styles.gpsBox}>
                    <Text style={styles.coords}>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</Text>
                    <Feather name="check-circle" size={18} color="#2ECC40" />
                  </View>
                )
                : <View style={styles.row}><ActivityIndicator size="small" color="#4680ff" /><Text style={styles.gpsLoading}> Menunggu koordinat GPS...</Text></View>
              }
            </View>

            <View style={styles.card}>
              <View style={styles.labelRow}>
                <Feather name="camera" size={18} color="#4680ff" style={{ marginRight: 8 }} />
                <Text style={styles.label}>Foto Dokumentasi (GPS)</Text>
              </View>
              {foto ? (
                <View>
                  <Image source={{ uri: foto.uri }} style={styles.fotoPreview} />
                  {waktuFoto && (
                    <View style={styles.waktuLockBox}>
                      <Feather name="lock" size={12} color="#4680ff" style={{ marginRight: 6 }} />
                      <Text style={styles.waktuLockValue}>Waktu Dijepret: {formatWaktu(waktuFoto)}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.retakeBtn} onPress={ambilFoto}>
                    <Feather name="refresh-cw" size={14} color="#4680ff" style={{ marginRight: 6 }} />
                    <Text style={styles.retakeText}>Ambil Ulang Foto</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.cameraBtn} onPress={ambilFoto}>
                  <View style={styles.cameraIconBg}>
                    <Feather name="camera" size={32} color="#4680ff" />
                  </View>
                  <Text style={styles.cameraText}>Buka Kamera Perangkat</Text>
                  <Text style={styles.cameraSub}>Pastikan lokasi terang dan GPS aktif</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.mainBtn, 
                (!foto || !selectedRS || !location || loadingFoto) && styles.btnDisabled]}
              onPress={uploadFoto}
              disabled={!foto || !selectedRS || !location || loadingFoto}
            >
              {loadingFoto
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Feather name="check" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnText}>Simpan & Lanjutkan</Text>
                  </>
                )
              }
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View style={styles.content}>
            <View style={styles.card}>
              <View style={styles.labelRow}>
                <Feather name="image" size={18} color="#4680ff" style={{ marginRight: 8 }} />
                <Text style={styles.label}>Pratinjau Foto</Text>
              </View>
              {foto && <Image source={{ uri: foto.uri }} style={styles.fotoPreviewSmall} />}
              <View style={styles.infoBox}>
                <Feather name="clock" size={14} color="#4680ff" style={{ marginRight: 8 }} />
                <Text style={styles.infoValue}>{formatWaktu(waktuFoto)}</Text>
              </View>
            </View>

            {daftarUsers.length > 0 && (
              <View style={styles.card}>
                <View style={styles.labelRow}>
                  <Feather name="users" size={18} color="#4680ff" style={{ marginRight: 8 }} />
                  <Text style={styles.label}>Tag Rekan Kerja</Text>
                </View>
                <View style={styles.tagContainer}>
                  {daftarUsers.map(user => {
                    const isTagged = taggedUsers.find(u => u.id === user.id);
                    return (
                      <TouchableOpacity key={user.id}
                        style={[styles.tagBtn, isTagged && styles.tagBtnActive]}
                        onPress={() => toggleTag(user)} activeOpacity={0.7}>
                        <Text style={[styles.tagText, isTagged && styles.tagTextActive]}>@{user.nama}</Text>
                        {isTagged && <Feather name="x" size={12} color="#fff" style={{ marginLeft: 4 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.labelRow}>
                <Feather name="edit-3" size={18} color="#4680ff" style={{ marginRight: 8 }} />
                <Text style={styles.label}>Keterangan Lembur</Text>
              </View>
              <TextInput
                style={styles.textArea}
                placeholder="Masukkan keterangan pekerjaan..."
                value={keterangan}
                onChangeText={setKeterangan}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.footerBtns}>
              <TouchableOpacity style={styles.btnDraft} onPress={() => router.back()}>
                <Text style={styles.btnDraftText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainBtn, { flex: 2, marginTop: 0 },
                (!keterangan || loadingSubmit) && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={!keterangan || loadingSubmit}
              >
                {loadingSubmit
                  ? <ActivityIndicator color="#fff" />
                  : (
                    <>
                      <Feather name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.btnText}>Konfirmasi Laporan</Text>
                    </>
                  )
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fa' },
  header: { padding: 25, paddingTop: 50, backgroundColor: '#4680ff', borderBottomLeftRadius: 35, borderBottomRightRadius: 35, elevation: 10, shadowColor: '#4680ff', shadowOpacity: 0.3, shadowRadius: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginLeft: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSub: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  stepLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', marginBottom: 16, borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  label: { fontSize: 15, fontWeight: '700', color: '#2d3748' },
  gpsBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#f0f9ff', borderRadius: 14, borderLeftWidth: 4, borderLeftColor: '#2ECC40' },
  coords: { fontSize: 14, color: '#4a5568', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  row: { flexDirection: 'row', alignItems: 'center' },
  gpsLoading: { color: '#718096', fontSize: 13, marginLeft: 10 },
  selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#edf2f7', borderRadius: 15, padding: 15, backgroundColor: '#f8fafc' },
  selectText: { fontSize: 15, color: '#2d3748', fontWeight: '500' },
  selectPlaceholder: { fontSize: 15, color: '#a0aec0' },
  dropdown: { marginTop: 12, borderWidth: 1, borderColor: '#edf2f7', borderRadius: 15, overflow: 'hidden', backgroundColor: '#fff' },
  searchBox: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#edf2f7' },
  searchInput: { flex: 1, fontSize: 14, color: '#2d3748', padding: 0 },
  rsItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  rsNama: { fontSize: 14, color: '#4a5568' },
  cameraBtn: { backgroundColor: '#eff6ff', borderRadius: 24, padding: 40, alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#4680ff' },
  cameraIconBg: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#4680ff', shadowOpacity: 0.2, shadowRadius: 5, marginBottom: 15 },
  cameraText: { fontSize: 16, color: '#4680ff', fontWeight: 'bold' },
  cameraSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  fotoPreview: { width: '100%', height: 260, borderRadius: 20, marginBottom: 15 },
  fotoPreviewSmall: { width: '100%', height: 180, borderRadius: 20, marginBottom: 15 },
  waktuLockBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 12, marginBottom: 12 },
  waktuLockValue: { fontSize: 12, fontWeight: '700', color: '#475569' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10 },
  retakeText: { color: '#4680ff', fontSize: 14, fontWeight: '700' },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#4a5568' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  tagBtnActive: { backgroundColor: '#4680ff', borderColor: '#4680ff' },
  tagText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  tagTextActive: { color: '#fff', fontWeight: 'bold' },
  textArea: { backgroundColor: '#f8fafc', borderRadius: 15, padding: 15, fontSize: 15, minHeight: 120, borderWidth: 1.5, borderColor: '#edf2f7', color: '#2d3748' },
  footerBtns: { flexDirection: 'row', gap: 12, paddingHorizontal: 4, marginTop: 10 },
  mainBtn: { backgroundColor: '#4680ff', borderRadius: 20, padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 5, shadowColor: '#4680ff', shadowOpacity: 0.4, shadowRadius: 8 },
  btnDisabled: { backgroundColor: '#cbd5e0' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnDraft: { flex: 1, borderWidth: 2, borderColor: '#cad4e0', borderRadius: 20, padding: 18, alignItems: 'center', backgroundColor: '#fff' },
  btnDraftText: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF4136', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 15, elevation: 5, shadowColor: '#FF4136', shadowOpacity: 0.3, shadowRadius: 5 },
  timerDanger: { backgroundColor: '#e63946' },
  timerText: { color: '#fff', fontSize: 15, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});