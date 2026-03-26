import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function StandbyScreen() {
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [riwayat, setRiwayat]   = useState([]);
  const [sudahHariIni, setSudahHariIni] = useState(false);
  const [dataHariIni, setDataHariIni]   = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const hariIni = new Date().getDay(); // 0=Minggu
  const jenisHariIni = hariIni === 0 ? 'minggu' : 'hari_raya';

  useEffect(() => {
    ambilRiwayat();
  }, []);

  async function ambilRiwayat() {
    try {
      const res = await api.get('/api/standby/riwayat');
      setRiwayat(res.data);
      const sudah = res.data.find(s => s.tanggal === today);
      if (sudah) {
        setSudahHariIni(true);
        setDataHariIni(sudah);
      }
    } catch (err) {
      console.log('Gagal ambil riwayat standby');
    }
  }

  async function handleApply() {
    const jenisLabel = jenisHariIni === 'minggu' ? 'Hari Minggu' : 'Hari Raya / Libur';
    Alert.alert(
      'Konfirmasi Standby',
      `Apply standby ${jenisLabel} untuk hari ini?\n${formatTanggal(today)}`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Apply',
          onPress: async () => {
            try {
              setLoading(true);
              await api.post('/api/standby', { tanggal: today });
              Alert.alert('Berhasil! 🎉', 'Status standby sudah dikirim ke grup WA', [
                { text: 'OK', onPress: () => ambilRiwayat() }
              ]);
            } catch (err) {
              Alert.alert('Gagal', err.response?.data?.error || 'Terjadi kesalahan');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }

  function formatTanggal(iso) {
    if (!iso) return '-';
    return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function labelJenis(jenis) {
    if (jenis === 'hari_raya') return '🎉 Hari Raya / Libur';
    return '📅 Hari Minggu';
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Standby</Text>
        <Text style={styles.subtitle}>Minggu & Hari Raya / Libur</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Status Hari Ini */}
        <View style={styles.card}>
          <Text style={styles.label}>📆 Hari Ini</Text>
          <Text style={styles.tanggalText}>{formatTanggal(today)}</Text>

          {sudahHariIni ? (
            <View style={styles.sudahBox}>
              <Text style={styles.sudahIcon}>✅</Text>
              <Text style={styles.sudahText}>Sudah apply standby hari ini</Text>
              <Text style={styles.sudahJenis}>{labelJenis(dataHariIni?.jenis_standby)}</Text>
            </View>
          ) : (
            <View style={styles.bisaBox}>
              <Text style={styles.bisaJenis}>{labelJenis(jenisHariIni)}</Text>
              <Text style={styles.bisaDesc}>
                {jenisHariIni === 'minggu'
                  ? 'Hari Minggu — kamu bisa apply standby'
                  : 'Hari libur / hari raya — kamu bisa apply standby'}
              </Text>
              <TouchableOpacity
                style={[styles.applyBtn, loading && styles.applyDisabled]}
                onPress={handleApply}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.applyText}>🟢 Apply Standby</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={[styles.card, { backgroundColor: '#fffbeb', borderColor: '#fcd34d', borderWidth: 1 }]}>
          <Text style={{ fontSize: 13, color: '#92400e', lineHeight: 20 }}>
            💡 <Text style={{ fontWeight: '600' }}>Info:</Text> Standby bisa diapply kapan saja.{'\n'}
            • Hari Minggu → tunjangan Minggu{'\n'}
            • Hari lain → tunjangan Hari Raya / Libur
          </Text>
        </View>

        {/* Riwayat */}
        {riwayat.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>📋 Riwayat Standby</Text>
            {riwayat.map(item => (
              <View key={item.id} style={styles.riwayatItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.riwayatTanggal}>{formatTanggal(item.tanggal)}</Text>
                  <Text style={styles.riwayatJenis}>{labelJenis(item.jenis_standby)}</Text>
                </View>
                <View style={[styles.statusBadge, item.status_wa === 'sent' ? styles.badgeSent : styles.badgePending]}>
                  <Text style={styles.badgeText}>{item.status_wa === 'sent' ? '✓ Terkirim' : '⏳'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f0f4f8' },
  header:         { padding: 20, paddingTop: 50, backgroundColor: '#2dc653' },
  back:           { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  title:          { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  subtitle:       { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  label:          { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 8 },
  tanggalText:    { fontSize: 14, color: '#555', marginBottom: 12 },
  sudahBox:       { alignItems: 'center', padding: 16, backgroundColor: '#e8f8ed', borderRadius: 10 },
  sudahIcon:      { fontSize: 36, marginBottom: 8 },
  sudahText:      { fontSize: 15, fontWeight: '600', color: '#1a7a3c' },
  sudahJenis:     { fontSize: 13, color: '#555', marginTop: 4 },
  bisaBox:        { padding: 16, backgroundColor: '#e8f8ed', borderRadius: 10, alignItems: 'center' },
  bisaJenis:      { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  bisaDesc:       { fontSize: 13, color: '#555', marginBottom: 16, textAlign: 'center' },
  applyBtn:       { backgroundColor: '#2dc653', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32 },
  applyDisabled:  { backgroundColor: '#a0aec0' },
  applyText:      { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  riwayatItem:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  riwayatTanggal: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  riwayatJenis:   { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeSent:      { backgroundColor: '#e8f8ed' },
  badgePending:   { backgroundColor: '#fff3e0' },
  badgeText:      { fontSize: 11, fontWeight: '600', color: '#555' },
});