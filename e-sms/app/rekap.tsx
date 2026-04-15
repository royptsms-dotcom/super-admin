import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, TextInput, Image,
  KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../services/api';
// import CONFIG from '../constants/config'; (SUDAH TIDAK DIPAKAI)

const TABS = ['Profil', 'Setting', 'Karyawan', 'Rekap'];

export default function AdminScreen() {
  const router  = useRouter();
  const [tab, setTab] = useState(0);
  const [token, setToken] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => setToken(t || ''));
  }, []);

  async function handleLogout() {
    await AsyncStorage.clear();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i} style={[styles.tabBtn, tab === i && styles.tabBtnActive]} onPress={() => setTab(i)}>
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {tab === 0 && <TabProfil />}
      {tab === 1 && <TabSetting />}
      {tab === 2 && <TabKaryawan />}
      {tab === 3 && <TabRekap token={token} />}
    </View>
  );
}

// ─── TAB PROFIL ───────────────────────────────────────────────────────────────
function TabProfil() {
  const [profil, setProfil]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [nama, setNama]       = useState('');
  const [noWa, setNoWa]       = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  useEffect(() => { ambilProfil(); }, []);

  async function ambilProfil() {
    try {
      const res = await api.get('/api/admin/profil');
      setProfil(res.data);
      setNama(res.data.nama || '');
      setNoWa(res.data.no_wa || '');
      setFotoUrl(res.data.foto_url || '');
    } catch (err) {
      Alert.alert('Error', 'Gagal ambil profil');
    } finally {
      setLoading(false);
    }
  }

  async function pilihFoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Izin Ditolak', 'Izin galeri diperlukan');
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: false });
    if (!result.canceled) {
      // Upload ke Cloudinary via backend
      const formData = new FormData();
      formData.append('foto', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'profil.jpg' });
      try {
        const res = await api.post('/api/auth/upload-foto', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setFotoUrl(res.data.url);
      } catch {
        Alert.alert('Gagal', 'Gagal upload foto');
      }
    }
  }

  async function simpan() {
    try {
      setSaving(true);
      await api.patch('/api/admin/profil', { nama, no_wa: noWa, foto_url: fotoUrl });
      Alert.alert('Berhasil', 'Profil berhasil diupdate');
      ambilProfil();
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  // Buat inisial dari nama
  function inisial(n) {
    return (n || '').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#1a1a2e" />;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pilihFoto}>
          {fotoUrl ? (
            <Image source={{ uri: fotoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInisial}>{inisial(nama)}</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Text style={{ color: '#fff', fontSize: 10 }}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarNama}>{profil?.nama}</Text>
        <Text style={styles.avatarRole}>{profil?.role?.toUpperCase()} • ID: {profil?.employee_id || '-'}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formLabel}>Nama</Text>
        <TextInput style={styles.formInput} value={nama} onChangeText={setNama} />

        <Text style={styles.formLabel}>Email</Text>
        <TextInput style={[styles.formInput, styles.inputDisabled]} value={profil?.email} editable={false} />

        <Text style={styles.formLabel}>No. WhatsApp</Text>
        <TextInput style={styles.formInput} value={noWa} onChangeText={setNoWa} keyboardType="phone-pad" placeholder="628xxxxxxxxxx" />

        <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={simpan} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 Simpan Perubahan</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── TAB SETTING ─────────────────────────────────────────────────────────────
function TabSetting() {
  const [config, setConfig]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [daftarRS, setDaftarRS] = useState([]);
  const [cariRS, setCariRS]     = useState('');

  useEffect(() => { ambilData(); }, []);

  async function ambilData() {
    try {
      const [cfgRes, rsRes] = await Promise.all([
        api.get('/api/admin/setting'),
        api.get('/api/admin/rs'),
      ]);
      setConfig(cfgRes.data);
      setDaftarRS(rsRes.data);
    } catch (err) {
      Alert.alert('Error', 'Gagal ambil setting');
    } finally {
      setLoading(false);
    }
  }

  async function simpanSetting() {
    try {
      setSaving(true);
      await api.patch('/api/admin/setting', {
        tarif_lembur_per_jam:   config.tarif_lembur_per_jam,
        max_lembur:             config.max_lembur,
        harga_standby_minggu:   config.harga_standby_minggu,
        harga_standby_hari_raya: config.harga_standby_hari_raya,
      });
      Alert.alert('Berhasil', 'Setting berhasil disimpan');
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  async function updateHargaRS(id, harga) {
    try {
      await api.patch(`/api/admin/rs/${id}`, { harga_share_lokasi: parseFloat(harga) || 0 });
      setDaftarRS(prev => prev.map(rs => rs.id === id ? { ...rs, harga_share_lokasi: parseFloat(harga) || 0 } : rs));
    } catch (err) {
      Alert.alert('Gagal', 'Gagal update harga RS');
    }
  }

  const rsSorted = daftarRS.filter(rs => rs.nama_rs.toLowerCase().includes(cariRS.toLowerCase()));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#1a1a2e" />;

  return (
    <ScrollView contentContainerStyle={styles.tabContent} keyboardShouldPersistTaps="handled">

      {/* Setting Lembur */}
      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>⏰ Setting Lembur</Text>

        <Text style={styles.formLabel}>Tarif per jam (Rp)</Text>
        <TextInput
          style={styles.formInput}
          value={String(config.tarif_lembur_per_jam || '')}
          onChangeText={v => setConfig(p => ({ ...p, tarif_lembur_per_jam: v }))}
          keyboardType="number-pad"
        />

        <Text style={styles.formLabel}>Maksimal lembur sekali lembur (Rp)</Text>
        <TextInput
          style={styles.formInput}
          value={String(config.max_lembur || '')}
          onChangeText={v => setConfig(p => ({ ...p, max_lembur: v }))}
          keyboardType="number-pad"
        />
      </View>

      {/* Setting Standby */}
      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>🟢 Setting Standby</Text>

        <Text style={styles.formLabel}>Tunjangan hari Minggu (Rp)</Text>
        <TextInput
          style={styles.formInput}
          value={String(config.harga_standby_minggu || '')}
          onChangeText={v => setConfig(p => ({ ...p, harga_standby_minggu: v }))}
          keyboardType="number-pad"
        />

        <Text style={styles.formLabel}>Tunjangan hari raya (Rp)</Text>
        <TextInput
          style={styles.formInput}
          value={String(config.harga_standby_hari_raya || '')}
          onChangeText={v => setConfig(p => ({ ...p, harga_standby_hari_raya: v }))}
          keyboardType="number-pad"
        />

        <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={simpanSetting} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 Simpan Setting</Text>}
        </TouchableOpacity>
      </View>

      {/* Harga per RS */}
      <View style={styles.settingCard}>
        <Text style={styles.settingTitle}>🏥 Harga Kunjungan per RS</Text>
        <TextInput
          style={[styles.formInput, { marginBottom: 10 }]}
          placeholder="Cari nama RS..."
          value={cariRS}
          onChangeText={setCariRS}
        />
        {rsSorted.map(rs => (
          <RSHargaItem key={rs.id} rs={rs} onSave={updateHargaRS} />
        ))}
      </View>

    </ScrollView>
  );
}

function RSHargaItem({ rs, onSave }) {
  const [harga, setHarga] = useState(String(rs.harga_share_lokasi || '0'));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave(rs.id, harga);
    setSaving(false);
  }

  return (
    <View style={styles.rsItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rsNama}>{rs.nama_rs}</Text>
        <TextInput
          style={styles.rsHargaInput}
          value={harga}
          onChangeText={setHarga}
          keyboardType="number-pad"
          placeholder="0"
        />
      </View>
      <TouchableOpacity style={styles.rsSaveBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.rsSaveBtnText}>✓</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── TAB KARYAWAN ─────────────────────────────────────────────────────────────
function TabKaryawan() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ nama: '', email: '', password: '', role: 'client', no_wa: '', employee_id: '' });
  const [saving, setSaving]     = useState(false);

  useEffect(() => { ambilUsers(); }, []);

  async function ambilUsers() {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      Alert.alert('Error', 'Gagal ambil data karyawan');
    } finally {
      setLoading(false);
    }
  }

  async function tambahKaryawan() {
    if (!form.nama || !form.email || !form.password)
      return Alert.alert('Error', 'Nama, email, dan password wajib diisi');
    try {
      setSaving(true);
      await api.post('/api/admin/users', form);
      Alert.alert('Berhasil', 'Karyawan berhasil ditambahkan');
      setShowForm(false);
      setForm({ nama: '', email: '', password: '', role: 'client', no_wa: '', employee_id: '' });
      ambilUsers();
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  async function nonaktifkan(id, nama) {
    Alert.alert('Nonaktifkan', `Nonaktifkan karyawan ${nama}?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Nonaktifkan', style: 'destructive', onPress: async () => {
        await api.delete(`/api/admin/users/${id}`);
        ambilUsers();
      }}
    ]);
  }

  async function aktifkan(id) {
    await api.patch(`/api/admin/users/${id}`, { is_active: true });
    ambilUsers();
  }

  return (
    <ScrollView contentContainerStyle={styles.tabContent} keyboardShouldPersistTaps="handled">

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addBtnText}>{showForm ? '✕ Tutup' : '+ Tambah Karyawan'}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.settingTitle}>Tambah Karyawan Baru</Text>

          <Text style={styles.formLabel}>Nama *</Text>
          <TextInput style={styles.formInput} value={form.nama} onChangeText={v => setForm(p => ({...p, nama: v}))} placeholder="Nama lengkap" />

          <Text style={styles.formLabel}>Email *</Text>
          <TextInput style={styles.formInput} value={form.email} onChangeText={v => setForm(p => ({...p, email: v}))} keyboardType="email-address" autoCapitalize="none" placeholder="email@contoh.com" />

          <Text style={styles.formLabel}>Password *</Text>
          <TextInput style={styles.formInput} value={form.password} onChangeText={v => setForm(p => ({...p, password: v}))} secureTextEntry placeholder="Minimal 6 karakter" />

          <Text style={styles.formLabel}>No. WhatsApp</Text>
          <TextInput style={styles.formInput} value={form.no_wa} onChangeText={v => setForm(p => ({...p, no_wa: v}))} keyboardType="phone-pad" placeholder="628xxxxxxxxxx" />

          <Text style={styles.formLabel}>ID Karyawan (kosongkan = otomatis)</Text>
          <TextInput style={styles.formInput} value={form.employee_id} onChangeText={v => setForm(p => ({...p, employee_id: v}))} placeholder="Contoh: 020" keyboardType="number-pad" />

          <Text style={styles.formLabel}>Role</Text>
          <View style={styles.roleRow}>
            {['client', 'admin'].map(r => (
              <TouchableOpacity key={r} style={[styles.roleBtn, form.role === r && styles.roleBtnActive]} onPress={() => setForm(p => ({...p, role: r}))}>
                <Text style={[styles.roleBtnText, form.role === r && styles.roleBtnTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={tambahKaryawan} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>+ Tambah</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? <ActivityIndicator color="#1a1a2e" style={{ marginTop: 20 }} /> : (
        users.map(u => (
          <View key={u.id} style={[styles.userCard, !u.is_active && styles.userCardInactive]}>
            <View style={styles.userAvatarSmall}>
              {u.foto_url
                ? <Image source={{ uri: u.foto_url }} style={styles.userAvatarImg} />
                : <Text style={styles.userAvatarTxt}>{(u.nama||'').split(' ').map(w=>w[0]).join('').toUpperCase().substring(0,2)}</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.userName}>{u.nama}</Text>
                <View style={[styles.rolePill, u.role === 'admin' && styles.rolePillAdmin]}>
                  <Text style={styles.rolePillText}>{u.role}</Text>
                </View>
                {!u.is_active && <View style={styles.inactivePill}><Text style={styles.rolePillText}>nonaktif</Text></View>}
              </View>
              <Text style={styles.userEmail}>{u.email}</Text>
              <Text style={styles.userId}>ID: {u.employee_id || '-'} • WA: {u.no_wa || '-'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => u.is_active ? nonaktifkan(u.id, u.nama) : aktifkan(u.id)}
              style={[styles.userActionBtn, u.is_active ? styles.btnHapus : styles.btnAktif]}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{u.is_active ? 'Nonaktif' : 'Aktifkan'}</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ─── TAB REKAP ────────────────────────────────────────────────────────────────
function TabRekap({ token }) {
  const daftarBulan = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val   = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    daftarBulan.push({ val, label });
  }

  const [bulan, setBulan]           = useState(daftarBulan[0].val);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [loadingXlsx, setLoadingXlsx] = useState(false);
  const [rekap, setRekap]           = useState(null);

  async function ambilRekap() {
    try {
      setLoading(true);
      setRekap(null);
      const res = await api.get(`/admin/rekap?bulan=${bulan}`);
      setRekap(res.data);
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  async function downloadXlsx() {
    try {
      setLoadingXlsx(true);
      const url = `${api.defaults.baseURL}/admin/rekap/xlsx?bulan=${bulan}&token=${token}`;
      await Linking.openURL(url);
    } catch {
      Alert.alert('Gagal', 'Tidak bisa membuka link download');
    } finally {
      setLoadingXlsx(false);
    }
  }

  function fmt(n) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);
  }

  const labelBulan = daftarBulan.find(b => b.val === bulan)?.label || bulan;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>

      {/* Dropdown pilih bulan */}
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>📅 Pilih Bulan</Text>
        <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowDropdown(!showDropdown)}>
          <Text style={styles.dropdownBtnText}>{labelBulan}</Text>
          <Text style={{ color: '#888' }}>{showDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showDropdown && (
          <View style={styles.dropdownList}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {daftarBulan.map(b => (
                <TouchableOpacity key={b.val} style={[styles.dropdownItem, bulan === b.val && styles.dropdownItemActive]}
                  onPress={() => { setBulan(b.val); setShowDropdown(false); setRekap(null); }}>
                  <Text style={[styles.dropdownItemText, bulan === b.val && styles.dropdownItemTextActive]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <TouchableOpacity style={[styles.saveBtn, { flex: 2 }, loading && styles.btnDisabled]} onPress={ambilRekap} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>🔍 Tarik Rekap</Text>}
          </TouchableOpacity>
          {rekap && (
            <TouchableOpacity style={[styles.xlsxBtn, loadingXlsx && styles.btnDisabled]} onPress={downloadXlsx} disabled={loadingXlsx}>
              {loadingXlsx ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>📥 XLSX</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {rekap && (
        <>
          <Text style={styles.rekapTitle}>Rekap {labelBulan}</Text>
          {rekap.rekap.map(item => (
            <View key={item.client.id} style={styles.rekapCard}>
              <View style={styles.rekapHeader}>
                <View>
                  <Text style={styles.rekapNama}>{item.client.nama}</Text>
                  <Text style={styles.rekapId}>ID: {item.client.employee_id || '-'}</Text>
                </View>
                <Text style={styles.rekapTotal}>{fmt(item.total.grand)}</Text>
              </View>
              <View style={styles.rekapRow}>
                <View style={[styles.rekapBox, { backgroundColor: '#E8F0FE' }]}>
                  <Text style={styles.rekapBoxLabel}>📍 Share</Text>
                  <Text style={styles.rekapBoxCount}>{item.shareLokasi.length}x</Text>
                  <Text style={styles.rekapBoxVal}>{fmt(item.total.share)}</Text>
                </View>
                <View style={[styles.rekapBox, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={styles.rekapBoxLabel}>🕐 Lembur</Text>
                  <Text style={styles.rekapBoxCount}>{item.lembur.length}x</Text>
                  <Text style={styles.rekapBoxVal}>{fmt(item.total.lembur)}</Text>
                </View>
                <View style={[styles.rekapBox, { backgroundColor: '#E8F8ED' }]}>
                  <Text style={styles.rekapBoxLabel}>🟢 Standby</Text>
                  <Text style={styles.rekapBoxCount}>{item.standby.length}x</Text>
                  <Text style={styles.rekapBoxVal}>{fmt(item.total.standby)}</Text>
                </View>
              </View>
            </View>
          ))}
          <View style={styles.grandTotalBox}>
            <Text style={styles.grandTotalLabel}>TOTAL SEMUA KARYAWAN</Text>
            <Text style={styles.grandTotalVal}>{fmt(rekap.rekap.reduce((s, r) => s + r.total.grand, 0))}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: '#f0f4f8' },
  header:              { padding: 20, paddingTop: 50, backgroundColor: '#1a1a2e', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle:         { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutText:          { color: '#e63946', fontSize: 14 },
  tabBar:              { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  tabBtn:              { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:        { borderBottomWidth: 2, borderColor: '#1a1a2e' },
  tabText:             { fontSize: 12, color: '#888' },
  tabTextActive:       { color: '#1a1a2e', fontWeight: '600' },
  tabContent:          { padding: 16, paddingBottom: 40 },

  // Profil
  avatarSection:       { alignItems: 'center', marginBottom: 20 },
  avatar:              { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder:   { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  avatarInisial:       { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  avatarEditBadge:     { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4361ee', borderRadius: 12, padding: 4 },
  avatarNama:          { fontSize: 18, fontWeight: '600', color: '#1a1a2e', marginTop: 10 },
  avatarRole:          { fontSize: 12, color: '#888', marginTop: 2 },

  // Form
  formCard:            { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  formLabel:           { fontSize: 12, color: '#555', marginBottom: 4, marginTop: 10 },
  formInput:           { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 11, fontSize: 14, backgroundColor: '#fafafa' },
  inputDisabled:       { backgroundColor: '#f0f0f0', color: '#888' },
  saveBtn:             { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 14 },
  saveBtnText:         { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnDisabled:         { backgroundColor: '#a0aec0' },
  xlsxBtn:             { backgroundColor: '#2dc653', borderRadius: 10, padding: 14, alignItems: 'center', flex: 1 },

  // Setting
  settingCard:         { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  settingTitle:        { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  rsItem:              { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0', gap: 8 },
  rsNama:              { fontSize: 12, color: '#1a1a2e', marginBottom: 4 },
  rsHargaInput:        { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 6, fontSize: 13, backgroundColor: '#fafafa' },
  rsSaveBtn:           { backgroundColor: '#1a1a2e', borderRadius: 8, padding: 10, alignItems: 'center', justifyContent: 'center', width: 36, height: 36 },
  rsSaveBtnText:       { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  // Karyawan
  addBtn:              { backgroundColor: '#4361ee', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 12 },
  addBtnText:          { color: '#fff', fontSize: 14, fontWeight: '600' },
  roleRow:             { flexDirection: 'row', gap: 10, marginTop: 4 },
  roleBtn:             { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  roleBtnActive:       { backgroundColor: '#1a1a2e', borderColor: '#1a1a2e' },
  roleBtnText:         { fontSize: 13, color: '#555' },
  roleBtnTextActive:   { color: '#fff' },
  userCard:            { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 1 },
  userCardInactive:    { opacity: 0.5 },
  userAvatarSmall:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  userAvatarImg:       { width: 44, height: 44, borderRadius: 22 },
  userAvatarTxt:       { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  userName:            { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  userEmail:           { fontSize: 12, color: '#666', marginTop: 1 },
  userId:              { fontSize: 11, color: '#888', marginTop: 1 },
  rolePill:            { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: '#e8f0fe' },
  rolePillAdmin:       { backgroundColor: '#fff3cd' },
  rolePillText:        { fontSize: 9, color: '#555', fontWeight: '600' },
  inactivePill:        { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, backgroundColor: '#fee2e2' },
  userActionBtn:       { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  btnHapus:            { backgroundColor: '#e63946' },
  btnAktif:            { backgroundColor: '#2dc653' },

  // Rekap
  dropdownBtn:         { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' },
  dropdownBtnText:     { fontSize: 14, color: '#1a1a2e' },
  dropdownList:        { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginTop: 4, overflow: 'hidden' },
  dropdownItem:        { padding: 12, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  dropdownItemActive:  { backgroundColor: '#e8f0fe' },
  dropdownItemText:    { fontSize: 14, color: '#555' },
  dropdownItemTextActive: { color: '#1a1a2e', fontWeight: '600' },
  rekapTitle:          { fontSize: 16, fontWeight: '600', color: '#1a1a2e', marginBottom: 10 },
  rekapCard:           { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, overflow: 'hidden', elevation: 1 },
  rekapHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#1a1a2e' },
  rekapNama:           { fontSize: 14, fontWeight: '600', color: '#fff' },
  rekapId:             { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  rekapTotal:          { fontSize: 13, fontWeight: 'bold', color: '#ffd700' },
  rekapRow:            { flexDirection: 'row', gap: 8, padding: 10 },
  rekapBox:            { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  rekapBoxLabel:       { fontSize: 10, color: '#555', marginBottom: 2 },
  rekapBoxCount:       { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' },
  rekapBoxVal:         { fontSize: 9, color: '#666', marginTop: 1 },
  grandTotalBox:       { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 4 },
  grandTotalLabel:     { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 },
  grandTotalVal:       { color: '#ffd700', fontSize: 20, fontWeight: 'bold' },
});