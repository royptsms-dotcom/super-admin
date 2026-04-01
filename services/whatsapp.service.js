const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode   = require('qrcode-terminal');
const supabase = require('../lib/supabase');

const CONFIG = {
  GRUP_WA_ID: '6282280585605-1489035825@g.us',
  TIMEZONE:   'Asia/Jakarta',
};

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'monitoring-app' }),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

client.on('qr', (qr) => {
  console.log('\n📱 Scan QR code berikut dengan WhatsApp kamu:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n⏳ Menunggu scan...\n');
});

client.on('ready', () => {
  console.log('✅ WhatsApp terhubung! Bot siap digunakan.');
  setTimeout(async () => {
    try {
      const chats  = await client.getChats();
      const groups = chats.filter(c => c.isGroup);
      console.log('\n📋 DAFTAR GRUP YANG BOT BISA AKSES:');
      console.log('=====================================');
      groups.forEach(g => console.log(`👥 ${g.name}\n   ID: ${g.id._serialized}\n`));
      console.log('=====================================\n');
    } catch (err) {
      console.error('❌ Error listing groups:', err.message);
    }
  }, 2000);
});

client.on('auth_failure', (msg) => { console.error('❌ Auth gagal:', msg); });
client.on('disconnected', (reason) => {
  console.warn('⚠️  WhatsApp terputus:', reason);
  setTimeout(() => client.initialize(), 5000);
});

client.initialize();

// ─── HELPER: Ambil WA Group ID dari nama job ──────────────────────────────────
async function getWaGroupIdByJobNama(jobNama) {
  if (!jobNama) return null;
  try {
    const { data: jobData, error: jobErr } = await supabase
      .from('jobs').select('id').eq('nama', jobNama).single();

    if (jobErr || !jobData) {
      console.log(`⚠️  Job "${jobNama}" tidak ditemukan di tabel jobs`);
      return null;
    }

    const { data: mapping, error: mapErr } = await supabase
      .from('wa_group_mappings').select('wa_group_id')
      .eq('job_id', jobData.id).single();

    if (mapErr || !mapping) {
      console.log(`⚠️  Grup WA untuk job "${jobNama}" belum didaftarkan`);
      return null;
    }

    console.log(`✅ Grup WA untuk job "${jobNama}": ${mapping.wa_group_id}`);
    return mapping.wa_group_id;
  } catch (err) {
    console.error('❌ getWaGroupIdByJobNama error:', err.message);
    return null;
  }
}

// ─── HELPER: Ambil WA Group ID dari job_id (integer) ─────────────────────────
async function getWaGroupIdByJobId(jobId) {
  if (!jobId) return null;
  try {
    const { data, error } = await supabase
      .from('wa_group_mappings').select('wa_group_id')
      .eq('job_id', jobId).single();
    if (error || !data) return null;
    return data.wa_group_id;
  } catch (err) {
    console.error('❌ getWaGroupIdByJobId error:', err.message);
    return null;
  }
}

// ─── HELPER: Ambil WA Group ID dari user_id ───────────────────────────────────
async function getWaGroupIdByUserId(userId) {
  if (!userId) return null;
  try {
    const { data: user, error: userErr } = await supabase
      .from('users').select('job').eq('id', userId).single();

    if (userErr || !user || !user.job) {
      console.log(`⚠️  User ${userId} tidak punya job`);
      return null;
    }

    return await getWaGroupIdByJobNama(user.job);
  } catch (err) {
    console.error('❌ getWaGroupIdByUserId error:', err.message);
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

// ─── KIRIM PESAN & FOTO ───────────────────────────────────────────────────────
async function kirimPesan(pesan, groupId = null) {
  try {
    const target = groupId || CONFIG.GRUP_WA_ID;
    console.log(`📤 Kirim pesan ke grup: ${target}`);
    await client.sendMessage(target, pesan);
    console.log('✅ Pesan terkirim');
    return { success: true };
  } catch (err) {
    console.error('❌ Gagal kirim pesan:', err.message);
    return { success: false, error: err.message };
  }
}

async function kirimFotoUrl(fotoUrl, caption, groupId = null) {
  try {
    const target = groupId || CONFIG.GRUP_WA_ID;
    console.log(`📤 Kirim foto ke grup: ${target}`);
    const media = await MessageMedia.fromUrl(fotoUrl, { unsafeMime: true });
    await client.sendMessage(target, media, { caption });
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

module.exports = {
  client,
  kirimShareLokasi,
  kirimLembur,
  kirimStandby,
  kirimPesan,
  kirimFotoUrl,
  getWaGroupIdByJobId,
  getWaGroupIdByJobNama,
  getWaGroupIdByUserId,
};