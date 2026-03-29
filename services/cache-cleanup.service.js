/**
 * Cache Cleanup Service
 * Auto-delete old lembur records (60+ days old)
 * Schedule: Every day at 03:00 WIB
 */

const supabase = require('../lib/supabase');

async function deleteOldLemburRecords() {
  try {
    // Hitung tanggal 60 hari yang lalu
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const cutoffDate = sixtyDaysAgo.toISOString();

    console.log(`🧹 Cache cleanup: Delete lembur records sebelum ${cutoffDate.split('T')[0]}`);

    // Delete dari tabel lembur
    const { data: deletedLembur, error: errorLembur } = await supabase
      .from('lembur')
      .delete()
      .lt('tanggal_lembur', cutoffDate);

    if (errorLembur) {
      console.error('❌ Gagal hapus lembur records:', errorLembur.message);
    } else {
      console.log(`✅ Deleted ${deletedLembur?.length || 0} old lembur records`);
    }

    // Delete dari tabel share_lokasi
    const { data: deletedShare, error: errorShare } = await supabase
      .from('share_lokasi')
      .delete()
      .lt('waktu_share', cutoffDate);

    if (errorShare) {
      console.error('❌ Gagal hapus share_lokasi records:', errorShare.message);
    } else {
      console.log(`✅ Deleted ${deletedShare?.length || 0} old share_lokasi records`);
    }

    // Delete dari tabel standby
    const { data: deletedStandby, error: errorStandby } = await supabase
      .from('standby')
      .delete()
      .lt('tanggal', cutoffDate);

    if (errorStandby) {
      console.error('❌ Gagal hapus standby records:', errorStandby.message);
    } else {
      console.log(`✅ Deleted ${deletedStandby?.length || 0} old standby records`);
    }

    console.log('🧹 Cache cleanup selesai');
    return { success: true };
  } catch (err) {
    console.error('❌ Cache cleanup error:', err.message);
    return { success: false, error: err.message };
  }
}

function scheduleCleanup() {
  function calculateMsTo3AM() {
    const now = new Date();
    const next3AM = new Date();
    
    // Set ke 03:00 (UTC+7)
    next3AM.setHours(3, 0, 0, 0);
    
    // Jika sudah lewat 03:00, set ke besok
    if (next3AM <= now) {
      next3AM.setDate(next3AM.getDate() + 1);
    }
    
    return next3AM - now;
  }

  // Jalankan pertama kali setelah timeout
  setTimeout(() => {
    deleteOldLemburRecords();
    
    // Kemudian jalankan setiap 24 jam
    setInterval(deleteOldLemburRecords, 24 * 60 * 60 * 1000);
  }, calculateMsTo3AM());

  console.log('⏰ Cache cleanup dijadwalkan: Setiap hari jam 03:00 WIB (delete records > 60 hari)');
}

module.exports = { deleteOldLemburRecords, scheduleCleanup };
