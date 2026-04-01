import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import api from '../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [jumlahDraft, setJumlahDraft] = useState(0);
  const [user, setUser]               = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

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
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Ya, Keluar',
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace('/');
        },
        style: 'destructive'
      }
    ]);
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
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.menuBtn}>
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
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
      </View>

      {showMenu && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity onPress={() => { router.push('/profil'); setShowMenu(false); }} style={styles.menuItem}>
            <Text style={styles.menuItemText}>👤 Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
            <Text style={[styles.menuItemText, { color: '#e63946' }]}>← Keluar</Text>
          </TouchableOpacity>
        </View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f0f4f8' },
  header:            { backgroundColor: '#4361ee', padding: 20, paddingTop: 54, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting:          { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  userName:          { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  userId:            { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  menuBtn:           { padding: 8, justifyContent: 'center', alignItems: 'center' },
  menuIcon:          { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  avatarBtn:         { marginLeft: 12 },
  avatarImg:         { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  avatarInisial:     { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  dropdownMenu:      { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e0e0e0', elevation: 3 },
  menuItem:          { padding: 14, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  menuItemText:      { fontSize: 14, color: '#1a1a2e', fontWeight: '500' },
  menuContainer:     { flex: 1, padding: 16, paddingTop: 20 },
  card:              { borderRadius: 16, padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14, elevation: 3 },
  cardIcon:          { fontSize: 30 },
  cardTitle:         { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  cardDesc:          { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  badge:             { backgroundColor: '#fff', borderRadius: 12, minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText:         { color: '#4361ee', fontSize: 13, fontWeight: 'bold' },
});