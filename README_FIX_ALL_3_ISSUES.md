# 📋 CHECKLIST - Langkah-Langkah untuk Fix Semua 3 Issue

## ✅ Issue #1: Grup WA Menu Alignment - SUDAH DIPERBAIKI

**Status**: ✅ DONE
- Logo dan text "Grup WA" sudah di-align dengan menu lain
- CSS styling sudah di-update: `display:flex`, `align-items:center`, `justify-content:center`
- Hapus duplicate styling yang conflict

**Action**: Refresh admin dashboard, lihat menu sidebar - seharusnya sudah rapi!

---

## ✅ Issue #2: Tabel wa_group_mappings Tidak Ditemukan - SIAP DIBUAT

**Status**: ⏳ READY FOR USER ACTION
- File SQL prompt sudah tersedia: `SUPABASE_SQL_PROMPT.sql`

**Langkah-langkah:**

1. **Buka Supabase Dashboard**
   - Url: https://app.supabase.com
   - Login dengan akun Anda
   - Pilih project yang sesuai

2. **Buka SQL Editor**
   - Di sidebar kiri klik "SQL Editor"
   - Klik "New Query" atau "+ New"

3. **Copy-Paste SQL Script**
   - Buka file: `D:\Android\SUPABASE_SQL_PROMPT.sql`
   - Copy seluruh isi file
   - Paste ke SQL Editor Supabase

4. **Jalankan Query**
   - Klik tombol **"RUN"** atau tekan `Ctrl+Enter`
   - Tunggu hingga selesai
   - Seharusnya ada pesan: "Command completed successfully"

5. **Verifikasi**
   - Refresh admin dashboard di browser
   - Klik menu "Grup WA"
   - Error message harus hilang
   - Jika masih ada error, check: Setting → Profil (verify admin role)

---

## ✅ Issue #3: Expo Server Error - SOLUSI TERSEDIA

**Status**: ⏳ READY FOR USER ACTION
- Panduan lengkap tersedia: `FIX_EXPO_SERVER_ERROR.md`

**Quick Fix (Coba dahulu):**

Buka terminal di folder `tunjangan-app-win`:

```bash
rm -rf .expo node_modules/.cache
rm package-lock.json
npm cache clean --force
npm install
npm start -- --clear
```

Tunggu hingga selesai, tekan `j` sekali untuk auto-download modules.

**Jika masih error:**
- Baca file: `FIX_EXPO_SERVER_ERROR.md` untuk langkah advance

---

## 📁 File-File Penting

| File | Fungsi |
|------|--------|
| `SUPABASE_SQL_PROMPT.sql` | SQL script ready-to-copy untuk Supabase |
| `FIX_EXPO_SERVER_ERROR.md` | Panduan lengkap fix error bundler |
| `SETUP_WA_GROUPS_TABLE.md` | Panduan alternatif (manual via UI) |

---

## 🎯 Urutan Kerja yang Disarankan

1. **Refresh browser** → Lihat apakah alignment Grup WA sudah fix
2. **Buat tabel di Supabase** → Copy-paste SQL script
3. **Fix Expo error** → Follow langkah-langkah di FIX_EXPO_SERVER_ERROR.md
4. **Test Grup WA** → Coba tambah grup WhatsApp baru

---

## 📞 Support

**Jika di-step manapun ada masalah:**
- **Alignment issue**: Refresh browser, clear cache (`Ctrl+Shift+Del`)
- **Tabel error**: Verifikasi di Supabase: Table Editor → wa_group_mappings ada tidak?
- **Expo error**: Lihat terminal output, biasanya ada hint lebih detail
- **Permission denied**: Check role admin di database

---

**Good luck! 🚀**
