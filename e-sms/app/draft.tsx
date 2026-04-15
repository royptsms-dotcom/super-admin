import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function DraftScreen() {
  const router = useRouter();
  const [draftList, setDraftList] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(null);

  useEffect(() => { ambilDraft(); }, []);

  async function ambilDraft() {
    try {
      setLoading(true);
      const res = await api.get('/lembur/draft');
      setDraftList(res.data);
    } catch (err) {
      Alert.alert('Error', 'Gagal ambil data draft');
    } finally {
      setLoading(false);
    }
  }

  async function hapusDraft(id) {
    Alert.alert('Hapus Draft', 'Draft ini akan dihapus permanen. Lanjutkan?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(id);
            await api.delete(`/lembur/draft/${id}`);
            setDraftList(prev => prev.filter(d => d.id !== id));
          } catch (err) {
            Alert.alert('Gagal', 'Gagal menghapus draft');
          } finally {
            setDeleting(null);
          }
        }
      }
    ]);
  }

  async function lanjutkanDraft(draft) {
    // Simpan draft ke AsyncStorage agar halaman lembur bisa baca
    await AsyncStorage.setItem('selected_draft', JSON.stringify({
      id:         draft.id,
      waktu_foto: draft.waktu_foto,
      foto_url:   draft.foto_url,
      rs_nama:    draft.rumah_sakit?.nama_rs,
    }));
    router.push('/lembur');
  }

  function formatWaktu(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Draft Lembur</Text>
        <Text style={styles.subtitle}>Lembur belum selesai diisi</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#7b2d8b" style={{ marginTop: 40 }} />
        ) : draftList.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Tidak ada draft</Text>
            <Text style={styles.emptyDesc}>Semua laporan lembur sudah selesai</Text>
          </View>
        ) : (
          draftList.map(draft => (
            <View key={draft.id} style={styles.card}>
              {draft.foto_url && (
                <Image source={{ uri: draft.foto_url }} style={styles.fotoPreview} />
              )}
              <View style={styles.infoRow}>
                <Text style={styles.rsNama}>{draft.rumah_sakit?.nama_rs || 'RS tidak diketahui'}</Text>
                <Text style={styles.waktuText}>📸 {formatWaktu(draft.waktu_foto)}</Text>
                <Text style={styles.waktuText}>💾 Dibuat: {formatWaktu(draft.created_at)}</Text>
              </View>
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.btnHapus}
                  onPress={() => hapusDraft(draft.id)}
                  disabled={deleting === draft.id}
                >
                  {deleting === draft.id
                    ? <ActivityIndicator size="small" color="#e63946" />
                    : <Text style={styles.btnHapusText}>🗑 Hapus</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnLanjut} onPress={() => lanjutkanDraft(draft)}>
                  <Text style={styles.btnLanjutText}>✏️ Lanjutkan</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0f4f8' },
  header:       { padding: 20, paddingTop: 50, backgroundColor: '#7b2d8b' },
  back:         { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  title:        { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  subtitle:     { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  card:         { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', elevation: 2 },
  fotoPreview:  { width: '100%', height: 160 },
  infoRow:      { padding: 14 },
  rsNama:       { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 6 },
  waktuText:    { fontSize: 13, color: '#666', marginBottom: 2 },
  btnRow:       { flexDirection: 'row', borderTopWidth: 1, borderColor: '#f0f0f0' },
  btnHapus:     { flex: 1, padding: 14, alignItems: 'center', borderRightWidth: 1, borderColor: '#f0f0f0' },
  btnHapusText: { color: '#e63946', fontSize: 14, fontWeight: '600' },
  btnLanjut:    { flex: 2, padding: 14, alignItems: 'center', backgroundColor: '#7b2d8b' },
  btnLanjutText:{ color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyBox:     { alignItems: 'center', marginTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 18, fontWeight: '600', color: '#1a1a2e' },
  emptyDesc:    { fontSize: 14, color: '#888', marginTop: 4 },
});