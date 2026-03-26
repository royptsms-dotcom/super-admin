import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, TextInput,
  KeyboardAvoidingView, Platform
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function ShareLokasiScreen() {
  const router = useRouter();
  const [loading, setLoading]         = useState(false);
  const [loadingRS, setLoadingRS]     = useState(true);
  const [location, setLocation]       = useState(null);
  const [daftarRS, setDaftarRS]       = useState([]);
  const [daftarUsers, setDaftarUsers] = useState([]);
  const [selectedRS, setSelectedRS]   = useState(null);
  const [keterangan, setKeterangan]   = useState('');
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [cariRS, setCariRS]           = useState('');
  const [showRS, setShowRS]           = useState(false);

  useEffect(() => {
    ambilLokasi();
    ambilMasterData();
  }, []);

  async function ambilLokasi() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Izin lokasi diperlukan untuk fitur ini');
      return;
    }
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
      Alert.alert('Error', 'Gagal ambil data master');
    } finally {
      setLoadingRS(false);
    }
  }

  function toggleTag(user) {
    setTaggedUsers(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  }

  async function handleSubmit() {
    if (!location) {
      Alert.alert('Error', 'Lokasi belum didapat, tunggu sebentar');
      return;
    }
    if (!selectedRS) {
      Alert.alert('Error', 'Pilih lokasi RS terlebih dahulu');
      return;
    }
    try {
      setLoading(true);
      await api.post('/api/share-lokasi', {
        rs_id:           selectedRS.id,
        latitude:        location.latitude,
        longitude:       location.longitude,
        keterangan,
        tagged_user_ids: taggedUsers.map(u => u.id),
      });
      Alert.alert('Berhasil! 🎉', 'Lokasi sudah dikirim ke grup WA', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  const rsSorted = daftarRS.filter(rs =>
    rs.nama_rs.toLowerCase().includes(cariRS.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Share Lokasi</Text>
        </View>

        {/* Status GPS */}
        <View style={styles.card}>
          <Text style={styles.label}>📍 Koordinat GPS</Text>
          {location ? (
            <Text style={styles.coords}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          ) : (
            <View style={styles.row}>
              <ActivityIndicator size="small" color="#4361ee" />
              <Text style={styles.gpsLoading}> Mendapatkan lokasi...</Text>
            </View>
          )}
        </View>

        {/* Pilih RS */}
        <View style={styles.card}>
          <Text style={styles.label}>🏥 Pilih Lokasi RS</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => setShowRS(!showRS)}
            activeOpacity={0.7}
          >
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
              {loadingRS ? (
                <ActivityIndicator style={{ padding: 16 }} />
              ) : (
                <View style={{ maxHeight: 220 }}>
                  <ScrollView
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="always"
                  >
                    {rsSorted.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.rsItem}
                        onPress={() => {
                          setSelectedRS(item);
                          setShowRS(false);
                          setCariRS('');
                        }}
                      >
                        <Text style={styles.rsNama}>{item.nama_rs}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {selectedRS && !showRS && (
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedNama}>{selectedRS.nama_rs}</Text>
            </View>
          )}
        </View>

        {/* Tag Rekan */}
        {daftarUsers.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>👥 Tag Rekan (opsional)</Text>
            <Text style={styles.sublabel}>Tandai rekan yang juga hadir</Text>
            <View style={styles.tagContainer}>
              {daftarUsers.map(user => {
                const isTagged = taggedUsers.find(u => u.id === user.id);
                return (
                  <TouchableOpacity
                    key={user.id}
                    style={[styles.tagBtn, isTagged && styles.tagBtnActive]}
                    onPress={() => toggleTag(user)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagText, isTagged && styles.tagTextActive]}>
                      @{user.nama}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Keterangan */}
        <View style={styles.card}>
          <Text style={styles.label}>📝 Keterangan (opsional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tambahkan keterangan..."
            value={keterangan}
            onChangeText={setKeterangan}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            scrollEnabled={false}
          />
        </View>

        {/* Tombol Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!location || !selectedRS || loading) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!location || !selectedRS || loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>📍 Kirim Share Lokasi</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f0f4f8' },
  header:            { padding: 20, paddingTop: 50, backgroundColor: '#4361ee' },
  back:              { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  title:             { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  card:              { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, elevation: 2 },
  label:             { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 10 },
  sublabel:          { fontSize: 12, color: '#888', marginBottom: 10, marginTop: -6 },
  coords:            { fontSize: 13, color: '#4361ee', fontFamily: 'monospace' },
  row:               { flexDirection: 'row', alignItems: 'center' },
  gpsLoading:        { color: '#888', fontSize: 13 },
  selectBtn:         { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fafafa' },
  selectText:        { fontSize: 14, color: '#1a1a2e' },
  selectPlaceholder: { fontSize: 14, color: '#aaa' },
  dropdown:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  searchInput:       { borderBottomWidth: 1, borderColor: '#eee', padding: 10, fontSize: 14 },
  rsItem:            { padding: 14, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  rsNama:            { fontSize: 14, color: '#1a1a2e' },
  selectedInfo:      { marginTop: 10, padding: 10, backgroundColor: '#e8f0fe', borderRadius: 8 },
  selectedNama:      { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  tagContainer:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBtn:            { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#4361ee' },
  tagBtnActive:      { backgroundColor: '#4361ee' },
  tagText:           { fontSize: 13, color: '#4361ee' },
  tagTextActive:     { color: '#fff' },
  textArea:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 100 },
  submitBtn:         { margin: 16, backgroundColor: '#4361ee', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  submitDisabled:    { backgroundColor: '#a0aec0' },
  submitText:        { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});