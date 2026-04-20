import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import api from '../services/api';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Modal } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [jumlahDraft, setJumlahDraft] = useState(0);
  const [user, setUser]               = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

  // SISTEM 2: SCAN QR GRUP
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning]     = useState(false);

  const [groupName, setGroupName] = useState<string | null>(null);

  async function handleBarCodeScanned({ data }: any) {
    setIsScanning(false);
    try {
      // Data format: "gid|gname" (atau cuma gid)
      const parts = data.split('|');
      const gid = parts[0];
      const gname = parts[1] || gid;

      // 1. Simpan ke Server (Permanen Selamanya)
      await api.post('/auth/update-group', { group_id: gid });

      // 2. Simpan cadangan lokal
      await AsyncStorage.setItem('forward_wa_group_id', gid);
      if(parts[1]) await AsyncStorage.setItem('forward_wa_group_name', gname);

      setGroupId(gid);
      setGroupName(gname);
      Alert.alert('Berhasil! ✅', `Tautan Grup WA berhasil disimpan selamanya.`);
      checkWAStatus();
    } catch (e) {
      Alert.alert('Gagal', 'Server tidak merespon saat menyimpan grup.');
    }
  }

  const [waOnline, setWaOnline]     = useState(false);
  const [groupId, setGroupId]       = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('user').then(u => { if (u) setUser(JSON.parse(u)); });
    checkWAStatus();
    const interval = setInterval(checkWAStatus, 15000); // Cek tiap 15 detik (Auto)
    return () => clearInterval(interval);
  }, []);

  async function checkWAStatus(force = false) {
    try {
      const res = await api.get('/wa-status' + (force ? '?refresh=1' : ''));
      
      // Update Group Info
      if (res.data.groupId) {
          setGroupId(res.data.groupId);
          setGroupName(res.data.groupName || 'Grup Terpilih');
      } else {
          const localGid = await AsyncStorage.getItem('forward_wa_group_id');
          const localGname = await AsyncStorage.getItem('forward_wa_group_name');
          setGroupId(localGid);
          setGroupName(localGname || '');
      }
      
      // Update Status WA
      setWaOnline(res.data.online === true);
    } catch (err) {
      // JANGAN setWaOnline(false) di sini! 
      // Jika terjadi error jaringan (hotspot stutters), biarkan status terakhir tetap tampil.
      // Ini mencegah status "mati-mati" padahal cuma sinyal hotspot yang goyang.
      console.log("Network status check failed, keeping last state.");
    }
  }

  useFocusEffect(
    useCallback(() => {
      ambilJumlahDraft();
      ambilProfil();
      checkWAStatus();
    }, [])
  );

  async function ambilJumlahDraft() {
    try {
      const res = await api.get('/lembur/draft');
      setJumlahDraft(res.data.length);
    } catch {}
  }

  async function ambilProfil() {
    try {
      const res = await api.get('/auth/profil');
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
          {!groupId && (
            <Text style={{ color: '#ffeb3b', fontSize: 9, fontWeight: 'bold', marginTop: 4 }}>
              ⚠️ BELUM SCAN QR GRUP
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          {/* LED INDICATOR (Clickable to Refresh) */}
          <TouchableOpacity 
            onPress={() => checkWAStatus(true)} 
            style={{ alignItems: 'center', marginRight: 4, padding: 5 }}
            activeOpacity={0.5}
          >
            <View style={[
              styles.ledCircle, 
              { backgroundColor: waOnline ? '#2ECC40' : '#e63946' }
            ]} />
            <Text style={{ fontSize: 8, color: '#fff', fontWeight: 'bold', marginTop: 2 }}>
              {waOnline ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>

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
          <TouchableOpacity onPress={() => { setIsScanning(true); setShowMenu(false); }} style={styles.menuItem}>
            <Text style={styles.menuItemText}>📸 Scan QR Grup</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
            <Text style={[styles.menuItemText, { color: '#e63946' }]}>← Keluar</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/share-lokasi')}>
          <View style={[styles.iconBox, { backgroundColor: '#eef2ff' }]}>
            <Feather name="map-pin" size={24} color="#4680ff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Share Lokasi</Text>
            <Text style={styles.cardDesc}>Kirim koordinat GPS Anda ke pusat</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#cbd5e0" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/lembur')}>
          <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
            <Feather name="camera" size={24} color="#f77f00" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Lembur</Text>
            <Text style={styles.cardDesc}>Foto bukti GPS & laporan kerja</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#cbd5e0" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/standby')}>
          <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
            <Feather name="check-square" size={24} color="#2dc653" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Standby</Text>
            <Text style={styles.cardDesc}>Pantau daftar standby hari ini</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#cbd5e0" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/draft')}>
          <View style={[styles.iconBox, { backgroundColor: '#faf5ff' }]}>
            <Feather name="file-text" size={24} color="#7b2d8b" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Draft</Text>
            <Text style={styles.cardDesc}>Selesaikan laporan yang tertunda</Text>
          </View>
          {jumlahDraft > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{jumlahDraft}</Text>
            </View>
          )}
          <Feather name="chevron-right" size={20} color="#cbd5e0" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
      </View>

      {/* Modal Scanner (Sistem 2) */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f6f9fc' 
  },
  header: { 
    backgroundColor: '#4680ff', 
    padding: 24, 
    paddingTop: 64, 
    paddingBottom: 40, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 10,
    shadowColor: '#4680ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  greeting: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: 14,
    fontWeight: '500'
  },
  userName: { 
    color: '#fff', 
    fontSize: 24, 
    fontWeight: '900', 
    marginTop: 4,
    letterSpacing: 0.5
  },
  userId: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 12, 
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  ledCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  menuBtn: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  menuIcon: { color: '#fff', fontSize: 20 },
  avatarBtn: { marginLeft: 12 },
  avatarImg: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    borderWidth: 3, 
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarPlaceholder: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 3, 
    borderColor: 'rgba(255,255,255,0.4)' 
  },
  avatarInisial: { color: '#4680ff', fontSize: 22, fontWeight: '900' },
  dropdownMenu: { 
    position: 'absolute',
    top: 130,
    right: 24,
    backgroundColor: '#fff', 
    borderRadius: 15,
    padding: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    zIndex: 999,
    width: 160
  },
  menuItem: { 
    padding: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 10
  },
  menuItemText: { fontSize: 14, color: '#2c3e50', fontWeight: '700' },
  menuContainer: { 
    flex: 1, 
    padding: 20, 
    marginTop: -20 
  },
  card: { 
    backgroundColor: '#fff',
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 18, 
    elevation: 8,
    shadowColor: '#30475e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: { fontSize: 24 },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#2c3e50' 
  },
  cardDesc: { 
    fontSize: 12, 
    color: '#7f8c8d', 
    marginTop: 4,
    lineHeight: 16
  },
  badge: { 
    backgroundColor: '#ff4757', 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 5 
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  // STYLES SISTEM 2
  scannerOverlay: { flex: 1, backgroundColor: '#000' },
  fullCamera: { flex: 1 },
  scanFrameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scanFrame: { width: 250, height: 250, borderWidth: 4, borderColor: '#4680ff', borderRadius: 20, backgroundColor: 'transparent' },
  scanText: { color: '#fff', marginTop: 20, fontWeight: 'bold', fontSize: 13 },
  closeScan: { marginTop: 40, padding: 15, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 }
});

// Dan jangan lupa mengupdate bagian render Card di return() agar menggunakan iconBox:
/*
Contoh perubahan di return:
<TouchableOpacity style={styles.card} onPress={() => router.push('/share-lokasi')}>
    <View style={[styles.iconBox, { backgroundColor: '#eef2ff' }]}>
        <Text style={styles.cardIcon}>📍</Text>
    </View>
    <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>Share Lokasi</Text>
        <Text style={styles.cardDesc}>Kirim koordinat GPS Anda ke dashboard pusat</Text>
    </View>
    <Text style={{color:'#cbd5e0'}}>❯</Text>
</TouchableOpacity>
*/