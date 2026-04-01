const { google } = require('googleapis');
const supabase   = require('../lib/supabase');

function getGoogleAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

async function getSheetId() {
  try {
    const { data } = await supabase
      .from('config').select('value').eq('key', 'google_sheets_url').single();
    if (data && data.value) {
      const match = data.value.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) return match[1];
    }
  } catch (_) {}
  return process.env.GOOGLE_SHEETS_ID;
}

async function ambilDataDariSheets(sheetsId) {
  const auth   = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetsId,
    range: 'A:C',
  });
  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];
  return rows.slice(1)
    .filter(row => row[0] && row[0].toString().trim() !== '')
    .map(row => ({
      nama_rs:            row[0]?.toString().trim().toUpperCase(),
      kode_rs:            row[1]?.toString().trim().toUpperCase() || generateKode(row[0]),
      harga_share_lokasi: parseFloat(row[2]) || 0,
    }));
}

function generateKode(namaRS) {
  return namaRS.toString().trim().toUpperCase()
    .split(' ').map(w => w[0]).join('').substring(0, 6);
}

async function syncRumahSakit(customUrl = null) {
  console.log('🔄 Mulai sync data RS dari Google Sheets...');
  try {
    if (customUrl && customUrl.trim()) {
      await supabase.from('config')
        .upsert({ key: 'google_sheets_url', value: customUrl.trim() }, { onConflict: 'key' });
      console.log('💾 URL baru disimpan ke config');
    }

    const sheetsId = await getSheetId();
    if (!sheetsId) return { success: false, error: 'Google Sheets ID belum dikonfigurasi' };

    console.log(`📊 Menggunakan Sheets ID: ${sheetsId}`);
    const dataSheets = await ambilDataDariSheets(sheetsId);
    console.log(`📋 Ditemukan ${dataSheets.length} lokasi di Sheets`);

    const kodeAktif = dataSheets.map(rs => rs.kode_rs);
    let diproses = 0, gagal = 0;

    // Upsert semua RS dari sheet
    for (const rs of dataSheets) {
      const { error } = await supabase
        .from('rumah_sakit')
        .upsert(
          {
            kode_rs:            rs.kode_rs,
            nama_rs:            rs.nama_rs,
            harga_share_lokasi: rs.harga_share_lokasi,
            is_active:          true,
            last_sync_at:       new Date(),
          },
          { onConflict: 'kode_rs' }
        );
      if (error) { console.error(`❌ Gagal upsert ${rs.nama_rs}:`, error.message); gagal++; }
      else diproses++;
    }

    // Nonaktifkan RS yang tidak ada di sheet
    const { data: semuaRS } = await supabase
      .from('rumah_sakit').select('kode_rs').eq('is_active', true);

    const rsUntukDinonaktifkan = (semuaRS || [])
      .filter(rs => !kodeAktif.includes(rs.kode_rs))
      .map(rs => rs.kode_rs);

    if (rsUntukDinonaktifkan.length > 0) {
      await supabase.from('rumah_sakit')
        .update({ is_active: false })
        .in('kode_rs', rsUntukDinonaktifkan);
      console.log(`🗑️  ${rsUntukDinonaktifkan.length} RS dinonaktifkan karena tidak ada di sheet`);
    }

    await supabase.from('config')
      .upsert({ key: 'last_rs_sync', value: new Date().toISOString() }, { onConflict: 'key' });

    console.log(`✅ Sync selesai: ${diproses} diproses, ${gagal} gagal, ${rsUntukDinonaktifkan.length} dinonaktifkan`);
    return {
      success: true,
      total: dataSheets.length,
      diproses,
      gagal,
      dinonaktifkan: rsUntukDinonaktifkan.length
    };
  } catch (err) {
    console.error('❌ Sync gagal:', err.message);
    return { success: false, error: err.message };
  }
}

function jadwalkanAutoSync() {
  function msKeJam2() {
    const now  = new Date();
    const jam2 = new Date();
    jam2.setHours(2 - 7, 0, 0, 0);
    if (jam2 <= now) jam2.setDate(jam2.getDate() + 1);
    return jam2 - now;
  }
  setTimeout(() => {
    syncRumahSakit();
    setInterval(syncRumahSakit, 24 * 60 * 60 * 1000);
  }, msKeJam2());
  console.log('⏰ Auto sync Google Sheets dijadwalkan setiap hari jam 02.00 WIB');
}

module.exports = { syncRumahSakit, jadwalkanAutoSync, getSheetId };