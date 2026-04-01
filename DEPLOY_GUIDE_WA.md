# Panduan Deploy Tunjangan App (Baileys Version)

Project telah dimigrasi dari `whatsapp-web.js` ke `@whiskeysockets/baileys` yang lebih stabil untuk deployment.

## 1. Persiapan Lokal
Pastikan kamu sudah melakukan scan QR code setidaknya sekali di komputer lokal agar file session terbentuk di folder `.baileys_auth`.
Folder ini berisi kunci autentikasi agar bot tidak perlu scan ulang setiap kali restart.

## 2. Struktur Folder Penting
- `.baileys_auth/` : Berisi file session (JANGAN di-upload ke GitHub, tapi harus ada di server).
- `.env` : Berisi konfigurasi API Key (JANGAN di-upload ke GitHub).

## 3. Deploy ke VPS (Rekomendasi)
Jika menggunakan VPS (Ubuntu/Debian), ikuti langkah ini:

### A. Install PM2
PM2 akan menjaga server tetap jalan di background.
```bash
npm install -g pm2
```

### B. Jalankan Server
```bash
pm2 start server.js --name "tunjangan-backend"
```

### C. Cek Log (Untuk Scan QR di Server)
Jika session belum ada, kamu perlu melihat QR di server:
```bash
pm2 logs tunjangan-backend
```
Besarkan terminal kamu agar QR code tidak berantakan.

## 4. Troubleshooting
- **QR Berantakan**: Pastikan font terminal kecil atau window terminal cukup lebar.
- **Gagal Connect**: Hapus folder `.baileys_auth` dan restart server untuk generate QR baru.
- **Error EACCES**: Jika ada error permission saat `npm install`, coba jalankan terminal sebagai Administrator.

---
**Status Terakhir:**
- `whatsapp-web.js` sudah dihapus.
- `baileys` sudah terinstal dan dikonfigurasi.
- `.gitignore` sudah diupdate.
