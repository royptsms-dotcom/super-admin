import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import api from '../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [jumlahDraft, setJumlahDraft] = useState(0);
  const [user, setUser]               = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then(u => { if (u) setUser(JSON.parse(u)); });
  }, []);

  useFocusEffect(
    useCallback(() => {
      ambilJumlahDraft();
      ambilProfil();
    }, [])
  );

  async function ambilJumlahDraft() {
    try {
      const res = await api.get('/api/lembur/draft');
      setJumlahDraft(res.data.length);
    } catch {}
  }

  async function ambilProfil() {
    try {
      const res = await api.get('/api/auth/profil');
      setUser(res.data);
      await AsyncStorage.setItem('user', JSON.stringify(res.data));
    } catch {}
  }

  async function handleLogout() {
    await AsyncStorage.clear();
    router.replace('/');
  }

  function inisial(nama) {
    return (nama || '').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Selamat Datang 👋</Text>
          <Text style={styles.userName}>{user?.nama || '-'}</Text>
          <Text style={styles.userId}>ID: {user?.employee_id || '-'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profil')} style={styles.avatarBtn}>
          {user?.foto_url ? (
            <Image source={{ uri: user.foto_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInisial}>{inisial(user?.nama)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={[styles.card, { backgroundColor: '#4361ee' }]}
          onPress={() => router.push('/share-lokasi')}>
          <Text style={styles.cardIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Share Lokasi</Text>
            <Text style={styles.cardDesc}>Kirim lokasi ke grup WA</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: '#f77f00' }]}
          onPress={() => router.push('/lembur')}>
          <Text style={styles.cardIcon}>📸</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Lembur</Text>
            <Text style={styles.cardDesc}>Foto GPS + keterangan lembur</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: '#2dc653' }]}
          onPress={() => router.push('/standby')}>
          <Text style={styles.cardIcon}>🟢</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Standby</Text>
            <Text style={styles.cardDesc}>Daftar standby hari ini</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: '#7b2d8b' }]}
          onPress={() => router.push('/draft')}>
          <Text style={styles.cardIcon}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Draft</Text>
            <Text style={styles.cardDesc}>Lembur belum selesai diisi</Text>
          </View>
          {jumlahDraft > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{jumlahDraft}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>← Keluar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f0f4f8' },
  header:            { backgroundColor: '#4361ee', padding: 20, paddingTop: 54, paddingBottom: 24, flexDirection: 'row', alignItems: 'center' },
  greeting:          { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  userName:          { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  userId:            { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  avatarBtn:         { marginLeft: 12 },
  avatarImg:         { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarInisial:     { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  menuContainer:     { flex: 1, padding: 16, paddingTop: 20 },
  card:              { borderRadius: 16, padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 3 },
  cardIcon:          { fontSize: 30 },
  cardTitle:         { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  cardDesc:          { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  badge:             { backgroundColor: '#fff', borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText:         { color: '#7b2d8b', fontSize: 13, fontWeight: 'bold' },
  logoutBtn:         { padding: 16, alignItems: 'center', marginBottom: 8 },
  logoutText:        { color: '#e63946', fontSize: 15, fontWeight: '500' },
});