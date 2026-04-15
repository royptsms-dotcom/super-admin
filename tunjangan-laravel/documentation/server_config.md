# Catatan Teknis Sistem E-SMS & WA Reporting
*Terakhir Diperbarui: 14 April 2026*

## 1. Konfigurasi Server & Port
Aplikasi berjalan menggunakan 3 layanan utama yang saling terhubung:
- **Laravel Backend**: `http://10.197.114.154:8000` (Melayani database dan API utama).
- **WA Bot Service (Node.js)**: `http://localhost:3001` (Microservice pengirim pesan WhatsApp).
- **Expo Go (Mobile)**: `http://10.197.114.154:8085` (Aplikasi yang dipegang karyawan).

## 2. Alur Pengiriman Pesan (Smart Session)
Sistem sekarang bersifat **Sentral/Terpusat**. Pesan tidak dikirim langsung dari HP, melainkan:
1. Karyawan submit laporan di aplikasi E-SMS.
2. Server Laravel menerima laporan dan mencari sesi WA yang aktif:
   - Prioritas 1: Sesi pribadi karyawan (`user_{id}`) jika karyawan sudah link mandiri.
   - Prioritas 2 (Fallback): Sesi Admin Utama (`report_bot`) di laptop pusat.
3. Laravel menembak API ke Port 3001 dan mengirim pesan ke Grup WA tujuan.

## 3. Fitur Lampu Indikator (LED)
Di layar utama HP Karyawan terdapat lampu indikator:
- **🟢 HIJAU (ON)**: Menandakan jalur forward siap (Bot Admin online DAN HP sudah scan target grup).
- **🔴 MERAH (OFF)**: Menandakan jalur terputus (Bot Admin offline ATAU HP belum tahu kirim ke grup mana).

## 4. Troubleshooting (Jika Macet)
Jika laporan tidak masuk ke grup WA:
1. Pastikan **Server 2 (WA Bot)** sedang berjalan.
2. Cek Dashboard Admin (Mapping Grup WA) -> Klik **Scan Bot Admin**. Pastikan statusnya **"✅ Bot Aktif"**. Jika belum, silakan Scan QR pakai WhatsApp asli.
3. Pastikan Karyawan sudah scan **QR Grup** dari Dashboard (Ikon QR biru di tabel mapping).
4. Jika IP Laptop berubah, update variabel `EXPO_LAN_ADDRESS` di file `Server 3 (Expo Mobile).bat`.

## 5. File Launcher (.bat)
Terletak di `D:\Android\`:
- `Server 1 (Laravel).bat` 
- `Server 2 (WhatsApp Bot).bat`
- `Server 3 (Expo Mobile).bat`
- `Server 4 (Cek Koneksi).bat`
