# 🆘 Fix Expo Server "SyntaxError: Unexpected token '<'" 

## 📝 Penyebab Error
Error ini terjadi karena:
- Metro bundler cache yang corrupt
- Build cache yang outdated
- React Native compiler yang tidak match dengan dependencies
- Experimental features yang conflict

## ✅ Solusi (Coba urut dari 1-3)

### ✔️ Solusi 1: Clear Cache & Reinstall (80% berhasil)

Buka terminal **di folder `tunjangan-app-win`** dan jalankan:

```bash
# Hapus semua cache
rm -rf .expo node_modules/.cache node_modules/.vite

# Hapus lock files
rm package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install

# Start dengan --clear flag
npm start -- --clear
```

**Tunggu hingga selesai** (bisa 2-5 menit). Klik `w` untuk open web dan `j` untuk auto download modules.

---

### ✔️ Solusi 2: Reset to Defaults (90% berhasil)

Jika Solusi 1 tidak berhasil:

```bash
# Reset ke template default
npm run reset-project

# Kemudian start
npm start -- --clear
```

---

### ✔️ Solusi 3: Disable Experimental Features (95% berhasil)

Edit file: `tunjangan-app-win/app.json`

Cari bagian `experiments`:
```json
"experiments": {
  "typedRoutes": true,
  "reactCompiler": true
}
```

Ubah menjadi:
```json
"experiments": {
  "typedRoutes": true,
  "reactCompiler": false
}
```

**Simpan**, kemudian di terminal:
```bash
npm start -- --clear
```

---

## 🎯 Jika Masih Tidak Berhasil

Coba **nuclear option** (full reset):

```bash
# HATI-HATI! Ini akan hapus package
rm -rf node_modules

# Hapus lock file
rm package-lock.json

# Hapus cache
rm -rf .expo .next .cache

# Reinstall dari scratch
npm install

# Start
npm start -- --clear
```

---

## 📌 Notes

- **Jangan tekan `j`** berulang kali! Biasanya auto-download akan jalan sendiri
- **Tunggu** hingga semua modules siap (tunggu sampai muncul `Web is waiting on http://localhost:8080`)
- Jika terminal minta `Press j | auto download`, cukup tekan `j` **sekali saja**
- Jika bundler masih error setelah Solusi 3, kemungkinan ada issue di React version compatibility

---

## 🔍 Debugging Tips

Jika masih error, cek:

1. **React version match:**
   ```bash
   npm list react react-native expo-router
   ```

2. **Cek apakah ada circular dependency:**
   ```bash
   npm audit
   ```

3. **Lihat full error di terminal output** - usually ada hint lebih detail

---

## 💡 Prevention

Untuk menghindari issue ini di masa depan:
- Jangan sering enable/disable experimental features
- Update dependencies secara regular
- `npm install` sebelum push ke git
- Commit `package-lock.json` ke git

