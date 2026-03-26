/**
 * WhatsApp Service - whatsapp-web.js
 * Untuk: Share Lokasi, Lembur, Standby
 * Setup: npm install whatsapp-web.js qrcode-terminal
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// ─── Konfigurasi ─────────────────────────────────────────────────────────────

const CONFIG = {
  // Ganti dengan ID grup WA tujuan
  // Cara dapat grup ID: lihat bagian "CARA DAPAT ID GRUP" di bawah
  GRUP_WA_ID: '628xxxxxxxxxx-xxxxxxxxxx@g.us',

  // Timezone Indonesia
  TIMEZONE: 'Asia/Jakarta',
};

// ─── Inisialisasi Client ──────────────────────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'monitoring-app' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// ─── Event Handler ────────────────────────────────────────────────────────────

client.on('qr', (qr) => {
  console.log('\n📱 Scan QR code berikut dengan WhatsApp kamu:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n⏳ Menunggu scan...\n');
});

client.on('ready', () => {
  console.log('✅ WhatsApp terhubung! Bot siap digunakan.');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Auth gagal:', msg);
});

client.on('disconnected', (reason) => {
  console.warn('⚠️  WhatsApp terputus:', reason);
  // Auto reconnect
  setTimeout(() => client.initialize(), 5000);
});

// Inisialisasi
client.initialize();

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Format tanggal dan jam ke format Indonesia
 */
function formatWaktu(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: CONFIG.TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

/**
 * Format angka ke rupiah
 */
function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
}

/**
 * Hitung durasi lembur dalam jam
 */
function hitungDurasiJam(waktuMulai, waktuSelesai) {
  const selisihMs = new Date(waktuSelesai) - new Date(waktuMulai);
  const jam = selisihMs / (1000 * 60 * 60);
  return Math.round(jam * 10) / 10; // 1 desimal
}

/**
 * Kirim pesan teks ke grup
 */
async function kirimPesan(pesan) {
  try {
    await client.sendMessage(CONFIG.GRUP_WA_ID, pesan);
    console.log('✅ Pesan terkirim ke grup WA');
    return { success: true };
  } catch (err) {
    console.error('❌ Gagal kirim pesan:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Kirim foto dengan caption ke grup
 */
async function kirimFoto(fotoPath, caption) {
  try {
    const media = MessageMedia.fromFilePath(fotoPath);
    await client.sendMessage(CONFIG.GRUP_WA_ID, media, { caption });
    console.log('✅ Foto + caption terkirim ke grup WA');
    return { success: true };
  } catch (err) {
    console.error('❌ Gagal kirim foto:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Format Pesan per Fitur ───────────────────────────────────────────────────

/**
 * Kirim notif SHARE LOKASI ke grup WA
 *
 * @param {Object} data
 * @param {string} data.namaClient       - Nama user yang share
 * @param {string} data.namaRS           - Nama rumah sakit dari master data
 * @param {number} data.latitude
 * @param {number} data.longitude
 * @param {string} data.keterangan       - Keterangan tambahan (opsional)
 * @param {string[]} data.taggedUsers    - Array nama user yang ditag (opsional)
 * @param {number}  data.hargaRS         - Harga kunjungan RS (dari master data)
 */
async function kirimShareLokasi(data) {
  const waktu = formatWaktu();
  const mapsUrl = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;

  // Bangun baris tag jika ada
  let bagianTag = '';
  if (data.taggedUsers && data.taggedUsers.length > 0) {
    const daftarTag = data.taggedUsers.map(nama => `@${nama}`).join(', ');
    bagianTag = `\n👥 *Bersama:* ${daftarTag}`;
  }

  // Bangun baris keterangan jika ada
  let bagianKeterangan = '';
  if (data.keterangan) {
    bagianKeterangan = `\n📝 *Keterangan:* ${data.keterangan}`;
  }

  const pesan =
    `📍 *SHARE LOKASI*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Nama:* ${data.namaClient}\n` +
    `🏥 *Lokasi RS:* ${data.namaRS}\n` +
    `🕐 *Waktu:* ${waktu}\n` +
    `💰 *Nilai:* ${formatRupiah(data.hargaRS)}` +
    bagianTag +
    bagianKeterangan + '\n' +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🗺️ *Maps:* ${mapsUrl}`;

  return await kirimPesan(pesan);
}

/**
 * Kirim notif LEMBUR ke grup WA (dengan foto GPS)
 *
 * @param {Object} data
 * @param {string} data.namaClient
 * @param {string} data.namaRS
 * @param {string} data.fotoPath         - Path file foto di server
 * @param {Date}   data.waktuFoto        - Waktu saat foto diambil (timestamp otomatis)
 * @param {Date}   data.waktuMulai       - Jam mulai lembur
 * @param {Date}   data.waktuSelesai     - Jam selesai lembur
 * @param {string} data.keterangan
 * @param {string[]} data.taggedUsers
 * @param {number} data.hargaPerJam      - Dari master data RS
 */
async function kirimLembur(data) {
  const waktuFotoStr = formatWaktu(new Date(data.waktuFoto));
  const waktuMulaiStr = formatWaktu(new Date(data.waktuMulai));
  const waktuSelesaiStr = formatWaktu(new Date(data.waktuSelesai));

  const durasiJam = hitungDurasiJam(data.waktuMulai, data.waktuSelesai);
  const totalHarga = durasiJam * data.hargaPerJam;

  let bagianTag = '';
  if (data.taggedUsers && data.taggedUsers.length > 0) {
    const daftarTag = data.taggedUsers.map(nama => `@${nama}`).join(', ');
    bagianTag = `\n👥 *Bersama:* ${daftarTag}`;
  }

  const caption =
    `🕐 *LEMBUR*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Nama:* ${data.namaClient}\n` +
    `🏥 *Lokasi RS:* ${data.namaRS}\n` +
    `📸 *Foto diambil:* ${waktuFotoStr}\n` +
    `⏰ *Mulai:* ${waktuMulaiStr}\n` +
    `⏹️  *Selesai:* ${waktuSelesaiStr}\n` +
    `⏱️  *Durasi:* ${durasiJam} jam\n` +
    `💰 *Total:* ${formatRupiah(totalHarga)}` +
    bagianTag + '\n' +
    `📝 *Keterangan:* ${data.keterangan}\n` +
    `━━━━━━━━━━━━━━━━━━━━`;

  return await kirimFoto(data.fotoPath, caption);
}

/**
 * Kirim notif STANDBY ke grup WA
 *
 * @param {Object} data
 * @param {string} data.namaClient
 * @param {string} data.tanggal          - Format: "2026-01-05"
 * @param {string} data.jenisStandby     - "minggu" | "hari_raya"
 * @param {string} data.namaHariRaya     - Hanya jika jenisStandby = "hari_raya"
 * @param {number} data.harga
 */
async function kirimStandby(data) {
  const tanggalStr = formatWaktu(new Date(data.tanggal + 'T00:00:00'));
  const waktuApply = formatWaktu();

  const labelJenis = data.jenisStandby === 'hari_raya'
    ? `🎉 Hari Raya${data.namaHariRaya ? ` (${data.namaHariRaya})` : ''}`
    : '📅 Hari Minggu';

  const pesan =
    `🟢 *STANDBY*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Nama:* ${data.namaClient}\n` +
    `📆 *Tanggal:* ${tanggalStr}\n` +
    `🏷️  *Jenis:* ${labelJenis}\n` +
    `💰 *Tunjangan:* ${formatRupiah(data.harga)}\n` +
    `🕐 *Apply:* ${waktuApply}\n` +
    `━━━━━━━━━━━━━━━━━━━━`;

  return await kirimPesan(pesan);
}

// ─── Export ───────────────────────────────────────────────────────────────────

module.exports = {
  client,
  kirimShareLokasi,
  kirimLembur,
  kirimStandby,
};

/*
 * ─── CARA DAPAT ID GRUP WA ────────────────────────────────────────────────────
 *
 * Setelah QR scan berhasil, jalankan script ini sekali:
 *
 *   client.on('ready', async () => {
 *     const chats = await client.getChats();
 *     chats.forEach(chat => {
 *       if (chat.isGroup) {
 *         console.log(`Nama: ${chat.name} | ID: ${chat.id._serialized}`);
 *       }
 *     });
 *   });
 *
 * Copy ID grup yang sesuai, tempel ke CONFIG.GRUP_WA_ID di atas.
 *
 * ─── TIPS ANTI BANNED ─────────────────────────────────────────────────────────
 *
 * 1. Jangan kirim pesan terlalu cepat — beri jeda minimal 2-3 detik antar pesan
 * 2. Gunakan nomor HP yang sudah lama aktif, bukan nomor baru
 * 3. Simpan sesi dengan LocalAuth agar tidak scan QR ulang setiap restart
 * 4. Jangan kirim ke ratusan orang sekaligus
 */
