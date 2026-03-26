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

async function ambilDataDariSheets() {
  const auth   = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    range:         'A:C',
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

async function syncRumahSakit() {
  console.log('🔄 Mulai sync data RS dari Google Sheets...');
  try {
    const dataSheets = await ambilDataDariSheets();
    console.log(`📋 Ditemukan ${dataSheets.length} lokasi di Sheets`);

    let ditambah = 0, gagal = 0;

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

      if (error) {
        console.error(`❌ Gagal upsert ${rs.nama_rs}:`, error.message);
        gagal++;
      } else {
        ditambah++;
      }
    }

    console.log(`✅ Sync selesai: ${ditambah} lokasi diproses, ${gagal} gagal`);
    return { success: true, total: dataSheets.length, ditambah, gagal };
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

module.exports = { syncRumahSakit, jadwalkanAutoSync };