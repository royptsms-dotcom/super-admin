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

export default function LemburScreen() {
  const router = useRouter();

  const [step, setStep]               = useState(1);
  const [foto, setFoto]               = useState(null);
  const [lemburId, setLemburId]       = useState(null);
  const [waktuFoto, setWaktuFoto]     = useState(null);
  const [location, setLocation]       = useState(null);
  const [loadingFoto, setLoadingFoto] = useState(false);

  const [daftarRS, setDaftarRS]       = useState([]);
  const [daftarUsers, setDaftarUsers] = useState([]);
  const [selectedRS, setSelectedRS]   = useState(null);
  const [keterangan, setKeterangan]   = useState('');
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [cariRS, setCariRS]           = useState('');
  const [showRS, setShowRS]           = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    ambilMasterData();
    ambilLokasi();
    cekDraftDipilih();
  }, []);

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
        api.get('/api/master/rs'),
        api.get('/api/master/users'),
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
      // ✅ Kunci jam SAAT foto dijepret, bukan saat upload
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
      formData.append('foto',      { uri: foto.uri, type: 'image/jpeg', name: `lembur_${Date.now()}.jpg` });
      formData.append('rs_id',     selectedRS.id);
      formData.append('latitude',  location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      formData.append('waktu_foto', waktuFoto); // ✅ kirim waktu dari HP (saat jepret)

      const res = await api.post('/api/lembur/foto', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setLemburId(res.data.lembur_id);
      setStep(2);
      // waktuFoto sudah di-set saat jepret, tidak perlu update dari server
    } catch (err) {
      Alert.alert('Gagal Upload', err.response?.data?.error || err.message);
    } finally {
      setLoadingFoto(false);
    }
  }

  async function handleSubmit() {
    if (!keterangan.trim()) return Alert.alert('Error', 'Keterangan wajib diisi');

    try {
      setLoadingSubmit(true);
      const waktuMulai   = waktuFoto;
      const waktuSelesai = new Date().toISOString();

      await api.post('/api/lembur/submit', {
        lembur_id:       lemburId,
        waktu_mulai:     waktuMulai,
        waktu_selesai:   waktuSelesai,
        keterangan,
        tagged_user_ids: taggedUsers.map(u => u.id),
      });

      Alert.alert('Berhasil! 🎉', 'Laporan lembur sudah dikirim ke grup WA', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoadingSubmit(false);
    }
  }

  function toggleTag(user) {
    setTaggedUsers(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  }

  function formatWaktu(iso) {
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
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Lembur</Text>
          <Text style={styles.stepLabel}>
            {step === 1 ? 'Langkah 1: Ambil Foto GPS' : 'Langkah 2: Isi Keterangan'}
          </Text>
        </View>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>🏥 Pilih Lokasi RS</Text>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setShowRS(!showRS)} activeOpacity={0.7}>
                <Text style={selectedRS ? styles.selectText : styles.selectPlaceholder}>
                  {selectedRS ? selectedRS.nama_rs : 'Ketuk untuk pilih RS...'}
                </Text>
              </TouchableOpacity>
              {showRS && (
                <View style={styles.dropdown}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Cari nama RS..."
                    value={cariRS}
                    onChangeText={setCariRS}
                    autoFocus
                  />
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
              {selectedRS && !showRS && (
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedNama}>{selectedRS.nama_rs}</Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>📍 Koordinat GPS</Text>
              {location
                ? <Text style={styles.coords}>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</Text>
                : <View style={styles.row}><ActivityIndicator size="small" color="#f77f00" /><Text style={styles.gpsLoading}> Mendapatkan lokasi...</Text></View>
              }
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>📸 Foto GPS</Text>
              {foto ? (
                <>
                  <Image source={{ uri: foto.uri }} style={styles.fotoPreview} />
                  {/* Tampilkan jam terkunci setelah foto dijepret */}
                  {waktuFoto && (
                    <View style={styles.waktuLockBox}>
                      <Text style={styles.waktuLockLabel}>🔒 Jam terkunci:</Text>
                      <Text style={styles.waktuLockValue}>{formatWaktu(waktuFoto)}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.retakeBtn} onPress={ambilFoto}>
                    <Text style={styles.retakeText}>📷 Ambil Ulang</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.cameraBtn} onPress={ambilFoto}>
                  <Text style={styles.cameraIcon}>📷</Text>
                  <Text style={styles.cameraText}>Buka Kamera</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#f77f00' },
                (!foto || !selectedRS || !location || loadingFoto) && styles.submitDisabled]}
              onPress={uploadFoto}
              disabled={!foto || !selectedRS || !location || loadingFoto}
            >
              {loadingFoto
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>💾 Simpan Foto & Lanjut</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>📸 Foto Lembur</Text>
              {foto && <Image source={{ uri: foto.uri }} style={styles.fotoPreview} />}
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>🔒 Waktu Pengambilan Foto (terkunci)</Text>
                <Text style={styles.infoValue}>{formatWaktu(waktuFoto)}</Text>
              </View>
            </View>

            {daftarUsers.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.label}>👥 Tag Rekan (opsional)</Text>
                <View style={styles.tagContainer}>
                  {daftarUsers.map(user => {
                    const isTagged = taggedUsers.find(u => u.id === user.id);
                    return (
                      <TouchableOpacity key={user.id}
                        style={[styles.tagBtn, isTagged && styles.tagBtnActive]}
                        onPress={() => toggleTag(user)} activeOpacity={0.7}>
                        <Text style={[styles.tagText, isTagged && styles.tagTextActive]}>@{user.nama}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.label}>📝 Keterangan</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Jelaskan kegiatan lembur..."
                value={keterangan}
                onChangeText={setKeterangan}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                scrollEnabled={false}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, margin: 16 }}>
              <TouchableOpacity style={[styles.btnOutline, { flex: 1 }]} onPress={() => router.back()}>
                <Text style={styles.btnOutlineText}>Simpan Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 2, margin: 0 },
                  (!keterangan || loadingSubmit) && styles.submitDisabled]}
                onPress={handleSubmit}
                disabled={!keterangan || loadingSubmit}
              >
                {loadingSubmit
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitText}>📤 Kirim ke WA</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f0f4f8' },
  header:            { padding: 20, paddingTop: 50, backgroundColor: '#f77f00' },
  back:              { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  title:             { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  stepLabel:         { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  card:              { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 2 },
  label:             { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 10 },
  coords:            { fontSize: 13, color: '#f77f00', fontFamily: 'monospace' },
  row:               { flexDirection: 'row', alignItems: 'center' },
  gpsLoading:        { color: '#888', fontSize: 13 },
  selectBtn:         { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fafafa' },
  selectText:        { fontSize: 14, color: '#1a1a2e' },
  selectPlaceholder: { fontSize: 14, color: '#aaa' },
  dropdown:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  searchInput:       { borderBottomWidth: 1, borderColor: '#eee', padding: 10, fontSize: 14 },
  rsItem:            { padding: 14, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  rsNama:            { fontSize: 14, color: '#1a1a2e' },
  selectedInfo:      { marginTop: 10, padding: 10, backgroundColor: '#fff3e0', borderRadius: 8 },
  selectedNama:      { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  cameraBtn:         { borderWidth: 2, borderColor: '#f77f00', borderStyle: 'dashed', borderRadius: 12, padding: 30, alignItems: 'center' },
  cameraIcon:        { fontSize: 40, marginBottom: 8 },
  cameraText:        { fontSize: 15, color: '#f77f00', fontWeight: '600' },
  fotoPreview:       { width: '100%', height: 200, borderRadius: 8, marginBottom: 10 },
  waktuLockBox:      { backgroundColor: '#fff3e0', borderRadius: 8, padding: 10, marginBottom: 8 },
  waktuLockLabel:    { fontSize: 11, color: '#888' },
  waktuLockValue:    { fontSize: 13, fontWeight: '600', color: '#f77f00' },
  retakeBtn:         { padding: 8, alignItems: 'center' },
  retakeText:        { color: '#f77f00', fontSize: 14 },
  infoBox:           { backgroundColor: '#fff3e0', borderRadius: 8, padding: 12, marginTop: 4 },
  infoLabel:         { fontSize: 12, color: '#888', marginBottom: 4 },
  infoValue:         { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  tagContainer:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBtn:            { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#f77f00' },
  tagBtnActive:      { backgroundColor: '#f77f00' },
  tagText:           { fontSize: 13, color: '#f77f00' },
  tagTextActive:     { color: '#fff' },
  textArea:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 100 },
  submitBtn:         { margin: 16, backgroundColor: '#f77f00', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitDisabled:    { backgroundColor: '#a0aec0' },
  submitText:        { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  btnOutline:        { borderWidth: 1.5, borderColor: '#f77f00', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnOutlineText:    { color: '#f77f00', fontSize: 14, fontWeight: '600' },
});