const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  downloadContentFromMessage,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino   = require('pino');
const fs     = require('fs');
const path   = require('path');
const supabase = require('../lib/supabase');

const CONFIG = {
  GRUP_WA_ID: '6282280585605-1489035825@g.us', // fallback
  TIMEZONE:   'Asia/Jakarta',
  SESSION_DIR: path.join(__dirname, '../.baileys_auth_final'),
};

let sock = null;
let isConnected = false;
let qrCode = null; // Simpan QR terbaru dalam bentuk string

// ─── KONEKSI ──────────────────────────────────────────────────────────────────
async function connectWA() {
  // Buat folder session jika belum ada
  if (!fs.existsSync(CONFIG.SESSION_DIR)) {
    fs.mkdirSync(CONFIG.SESSION_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(CONFIG.SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Windows', 'Chrome', '121.0.0'],
    syncFullHistory: false, // Kurangi load saat awal agar tidak stuck
    connectTimeoutMs: 90000, 
    defaultQueryTimeoutMs: 90000,
    keepAliveIntervalMs: 30000,
    generateHighQualityLinkPreview: false,
  });

  // Simpan kredensial saat update
  sock.ev.on('creds.update', saveCreds);

  // Handle QR manual
  sock.ev.on('connection.update', ({ qr }) => {
    if (qr) {
      qrCode = qr; // Simpan QR untuk web
      const qrcode = require('qrcode-terminal');
      console.log('\n📱 Scan QR code berikut dengan WhatsApp kamu:\n');
      qrcode.generate(qr, { small: true });
      console.log('\n⏳ Menunggu scan (atau cek di Dashboard Admin)...\n');
    }
  });

  // Monitor status koneksi
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n📱 Scan QR code di atas dengan WhatsApp kamu\n');
    }

    if (connection === 'close') {
      isConnected = false;
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output?.statusCode
        : null;

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.warn(`⚠️  WhatsApp terputus (${statusCode}), reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        console.log('🔄 Mencoba reconnect dalam 5 detik...');
        setTimeout(connectWA, 5000);
      } else {
        console.log('🔴 Sesi expired/logout. Hapus folder session dan restart server untuk scan ulang.');
      }
    } else if (connection === 'open') {
      isConnected = true;
      qrCode = null; // Hapus QR jika sudah connect
      console.log('✅ WhatsApp terhubung via Baileys! Bot siap digunakan.');
      // Print semua grup setelah connect
      setTimeout(listGrups, 3000);
    }
  });
}

// Fungsi Logout untuk ganti nomor
async function logoutWA() {
  try {
    qrCode = null;
    isConnected = false;

    if (sock) {
      try {
        await sock.logout();
      } catch (e) {
        console.warn('⚠️  Socket logout failed (already closed?):', e.message);
        sock.end(); // Paksa tutup socket jika logout gagal
      }
    }
    
    // Hapus folder session secara paksa
    if (fs.existsSync(CONFIG.SESSION_DIR)) {
      try {
        fs.rmSync(CONFIG.SESSION_DIR, { recursive: true, force: true });
        console.log('🗑️  Folder session berhasil dihapus.');
      } catch (rmErr) {
        console.error('❌ Gagal hapus folder session:', rmErr.message);
      }
    }

    console.log('🔴 WhatsApp Logout & Session dihapus. Silakan scan ulang.');
    
    // Tunggu sebentar lalu inisialisasi ulang untuk minta QR baru
    setTimeout(connectWA, 2000);
    return { success: true };
  } catch (err) {
    console.error('❌ Gagal proses logout:', err.message);
    // Tetap kembalikan success jika folder berhasil dihapus/direset
    return { success: true, message: 'Session reset forced' };
  }
}

// Print semua grup yang bisa diakses
async function listGrups() {
  try {
    const groups = Object.values(await sock.groupFetchAllParticipating());
    console.log('\n📋 DAFTAR GRUP YANG BOT BISA AKSES:');
    console.log('=====================================');
    groups.forEach(g => console.log(`👥 ${g.subject}\n   ID: ${g.id}\n`));
    console.log('=====================================\n');
  } catch (err) {
    console.error('❌ Error listing groups:', err.message);
  }
}
// Fetch semua grup (untuk API)
async function getGrups() {
  try {
    if (!isConnected || !sock) return [];
    const groups = Object.values(await sock.groupFetchAllParticipating());
    return groups.map(g => ({
      id: g.id,
      name: g.subject
    }));
  } catch (err) {
    console.error('❌ Error fetching groups:', err.message);
    return [];
  }
}

// ─── HELPERS LOOKUP GRUP ──────────────────────────────────────────────────────
async function getWaGroupIdByJobNama(jobNama) {
  if (!jobNama) return null;
  console.log(`🔍 Mencari Grup WA untuk Job: "${jobNama}"...`);
  try {
    const { data: jobs, error: jobErr } = await supabase
      .from('jobs').select('id, nama');
    
    if (jobErr || !jobs) {
      console.log(`⚠️  Gagal ambil daftar jobs:`, jobErr?.message);
      return null;
    }

    // Cari job dengan case-insensitive
    const targetJob = jobs.find(j => j.nama.toLowerCase() === jobNama.toLowerCase());
    
    if (!targetJob) {
      console.log(`⚠️  Job "${jobNama}" tidak ditemukan di tabel "jobs"`);
      return null;
    }

    const { data: mapping, error: mapErr } = await supabase
      .from('wa_group_mappings').select('wa_group_id')
      .eq('job_id', targetJob.id).single();

    if (mapErr || !mapping) {
      console.log(`⚠️  Job "${jobNama}" (ID: ${targetJob.id}) belum di-mapping ke Grup WA manapun`);
      return null;
    }
    console.log(`✅ Grup WA Ditemukan: ${mapping.wa_group_id} untuk Job "${jobNama}"`);
    return mapping.wa_group_id;
  } catch (err) {
    console.error('❌ getWaGroupIdByJobNama error:', err.message);
    return null;
  }
}

async function getWaGroupIdByJobId(jobId) {
  if (!jobId) return null;
  try {
    const { data, error } = await supabase
      .from('wa_group_mappings').select('wa_group_id')
      .eq('job_id', jobId).single();
    if (error || !data) return null;
    return data.wa_group_id;
  } catch (err) {
    return null;
  }
}

async function getWaGroupIdByUserId(userId) {
  if (!userId) return null;
  try {
    const { data: user, error } = await supabase
      .from('users').select('job').eq('id', userId).single();
    if (error || !user || !user.job) return null;
    return await getWaGroupIdByJobNama(user.job);
  } catch (err) {
    return null;
  }
}

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────
function formatWaktu(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: CONFIG.TIMEZONE,
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

function formatDurasi(durasiMenit) {
  if (!durasiMenit) return '0 menit';
  const jam   = Math.floor(durasiMenit / 60);
  const menit = durasiMenit % 60;
  if (jam === 0) return `${menit} menit`;
  if (menit === 0) return `${jam} jam`;
  return `${jam} jam ${menit} menit`;
}

// ─── KIRIM PESAN ──────────────────────────────────────────────────────────────
async function kirimPesan(pesan, groupId = null) {
  try {
    if (!isConnected || !sock) {
      console.error('❌ Gagal Kirim: WhatsApp belum terhubung (Perlu Scan QR!)');
      return { success: false, error: 'WhatsApp belum terhubung' };
    }
    const target = groupId || CONFIG.GRUP_WA_ID;
    console.log(`📤 Sedang mengirim pesan ke: ${target}...`);
    await sock.sendMessage(target, { text: pesan });
    console.log('✅ Pesan WhatsApp Berhasil Terkirim!');
    return { success: true };
  } catch (err) {
    console.error('❌ Gagal total kirim pesan:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── KIRIM FOTO URL ───────────────────────────────────────────────────────────
async function kirimFotoUrl(fotoUrl, caption, groupId = null) {
  try {
    if (!isConnected || !sock) {
      console.error('❌ WhatsApp belum terhubung');
      return { success: false, error: 'WhatsApp belum terhubung' };
    }
    const target = groupId || CONFIG.GRUP_WA_ID;
    console.log(`📤 Kirim foto ke grup: ${target}`);
    await sock.sendMessage(target, {
      image: { url: fotoUrl },
      caption,
    });
    console.log('✅ Foto + caption terkirim');
    return { success: true };
  } catch (err) {
    console.error('❌ Gagal kirim foto:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── SHARE LOKASI ─────────────────────────────────────────────────────────────
async function kirimShareLokasi(data, groupId = null) {
  const waktu   = formatWaktu();
  const mapsUrl = `https://maps.google.com/?q=${data.latitude},${data.longitude}`;

  let bagianTag = '';
  if (data.taggedUsers && data.taggedUsers.length > 0)
    bagianTag = `\n👥 *Bersama:* ${data.taggedUsers.map(n => `@${n}`).join(', ')}`;

  let bagianKet = '';
  if (data.keterangan)
    bagianKet = `\n📝 *Keterangan:* ${data.keterangan}`;

  const pesan =
    `📍 *SHARE LOKASI*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Nama:* ${data.namaClient}\n` +
    `🏥 *Lokasi RS:* ${data.namaRS}\n` +
    `🕐 *Waktu:* ${waktu}` +
    bagianTag + bagianKet + '\n' +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🗺️ *Maps:* ${mapsUrl}`;

  return await kirimPesan(pesan, groupId);
}

// ─── LEMBUR ───────────────────────────────────────────────────────────────────
async function kirimLembur(data, groupId = null) {
  const waktuFotoStr = formatWaktu(new Date(data.waktuFoto));

  let bagianTag = '';
  if (data.taggedUsers && data.taggedUsers.length > 0)
    bagianTag = `\n👥 *Bersama:* ${data.taggedUsers.map(n => `@${n}`).join(', ')}`;

  let bagianTanggal = '';
  if (data.tanggalLembur) {
    const tgl = new Date(data.tanggalLembur + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    bagianTanggal = `\n📆 *Tanggal Lembur:* ${tgl}`;
  }

  const caption =
    `🕐 *LEMBUR*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Nama:* ${data.namaClient}\n` +
    `🏥 *Lokasi RS:* ${data.namaRS}\n` +
    `📸 *Foto diambil:* ${waktuFotoStr}` +
    bagianTanggal + bagianTag + '\n' +
    `📝 *Keterangan:* ${data.keterangan}\n` +
    `━━━━━━━━━━━━━━━━━━━━`;

  return await kirimFotoUrl(data.fotoUrl, caption, groupId);
}

// ─── STANDBY ──────────────────────────────────────────────────────────────────
async function kirimStandby(data, groupId = null) {
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
    `🕐 *Apply:* ${waktuApply}\n` +
    `━━━━━━━━━━━━━━━━━━━━`;

  return await kirimPesan(pesan, groupId);
}

// Inisialisasi koneksi saat module di-load
connectWA();

module.exports = {
  connectWA,
  kirimShareLokasi,
  kirimLembur,
  kirimStandby,
  kirimPesan,
  kirimFotoUrl,
  getWaGroupIdByJobId,
  getWaGroupIdByJobNama,
  getWaGroupIdByUserId,
  getGrups,
  logoutWA,
  get isConnected() { return isConnected; },
  get qrCode() { return qrCode; }
};