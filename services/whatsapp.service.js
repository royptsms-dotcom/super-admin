const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
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
client.on('ready', () => { console.log('✅ WhatsApp terhubung! Bot siap digunakan.'); });
client.on('auth_failure', (msg) => { console.error('❌ Auth gagal:', msg); });
client.on('disconnected', (reason) => {
  console.warn('⚠️  WhatsApp terputus:', reason);
  setTimeout(() => client.initialize(), 5000);
});
client.initialize();

function formatWaktu(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: CONFIG.TIMEZONE,
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
}

function formatDurasi(durasiMenit) {
  if (!durasiMenit) return '0 menit';
  const jam   = Math.floor(durasiMenit / 60);
  const menit = durasiMenit % 60;
  if (jam === 0) return `${menit} menit`;
  if (menit === 0) return `${jam} jam`;
  return `${jam} jam ${menit} menit`;
}

async function kirimPesan(pesan, groupId = null) {
  try {
    const targetGroup = groupId || CONFIG.GRUP_WA_ID;
    await client.sendMessage(targetGroup, pesan);
    console.log('✅ Pesan terkirim ke grup WA');
    return { success: true };
  } catch (err) {
    console.error('❌ Gagal kirim pesan:', err.message);
    return { success: false, error: err.message };
  }
}

async function kirimFotoUrl(fotoUrl, caption, groupId = null) {
  try {
    const targetGroup = groupId || CONFIG.GRUP_WA_ID;
    const media = await MessageMedia.fromUrl(fotoUrl, { unsafeMime: true });
    await client.sendMessage(targetGroup, media, { caption });
    console.log('✅ Foto + caption terkirim ke grup WA');
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

  let bagianKeterangan = '';
  if (data.keterangan)
    bagianKeterangan = `\n📝 *Keterangan:* ${data.keterangan}`;

  const pesan =
    `📍 *SHARE LOKASI*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Nama:* ${data.namaClient}\n` +
    `🏥 *Lokasi RS:* ${data.namaRS}\n` +
    `🕐 *Waktu:* ${waktu}` +
    bagianTag + bagianKeterangan + '\n' +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🗺️ *Maps:* ${mapsUrl}`;

  return await kirimPesan(pesan, groupId);
}

// ─── LEMBUR ───────────────────────────────────────────────────────────────────
async function kirimLembur(data, groupId = null) {
  const waktuFotoStr = formatWaktu(new Date(data.waktuFoto));
  const durasiStr    = formatDurasi(data.durasiMenit);

  let bagianTag = '';
  if (data.taggedUsers && data.taggedUsers.length > 0)
    bagianTag = `\n👥 *Bersama:* ${data.taggedUsers.map(n => `@${n}`).join(', ')}`;

  // Info tanggal lembur jika berbeda dari tanggal foto
  let bagianTanggal = '';
  if (data.tanggalLembur) {
    const tglLembur = new Date(data.tanggalLembur + 'T00:00:00').toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    bagianTanggal = `\n📆 *Tanggal Lembur:* ${tglLembur}`;
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

module.exports = { client, kirimShareLokasi, kirimLembur, kirimStandby, getWaGroupIdByJobId, kirimPesan, kirimFotoUrl };

// Helper function: Get WA Group ID by Job ID
async function getWaGroupIdByJobId(jobId) {
  try {
    const { data, error } = await supabase
      .from('wa_group_mappings')
      .select('wa_group_id')
      .eq('job_id', jobId)
      .single();
    
    if (error || !data) return null;
    return data.wa_group_id;
  } catch (err) {
    console.error('Error getting WA group ID:', err.message);
    return null;
  }
}