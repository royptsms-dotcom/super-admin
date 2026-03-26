const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');
const auth     = require('../middleware/auth');
const wa       = require('../services/whatsapp.service');

// POST /api/standby
// Body: { tanggal } — sistem otomatis deteksi Minggu atau hari raya
router.post('/', auth, async (req, res) => {
  try {
    const { tanggal } = req.body; // format: "2026-01-04"

    const tgl  = new Date(tanggal + 'T00:00:00');
    const hari = tgl.getDay(); // 0 = Minggu

    // Cek apakah hari raya
    const { data: hariRaya } = await supabase
      .from('hari_raya')
      .select('nama_hari_raya')
      .eq('tanggal', tanggal)
      .single();

    // Tentukan jenis standby
    let jenisStandby, namaHariRaya = null;
    if (hariRaya) {
      jenisStandby  = 'hari_raya';
      namaHariRaya  = hariRaya.nama_hari_raya;
    } else if (hari === 0) {
      jenisStandby  = 'minggu';
    } else {
      return res.status(400).json({
        error: 'Standby hanya bisa diajukan di hari Minggu atau hari raya'
      });
    }

    // Ambil harga dari config
    const configKey = jenisStandby === 'hari_raya'
      ? 'harga_standby_hari_raya'
      : 'harga_standby_minggu';

    const { data: cfg } = await supabase
      .from('config')
      .select('value')
      .eq('key', configKey)
      .single();

    const harga = parseFloat(cfg?.value || 0);

    // Simpan standby
    const { data: standby, error } = await supabase
      .from('standby')
      .insert({
        user_id:       req.user.id,
        tanggal,
        jenis_standby: jenisStandby,
        nama_hari_raya: namaHariRaya,
        harga,
      })
      .select()
      .single();

    if (error) {
      // Cek jika sudah pernah submit hari yang sama
      if (error.code === '23505')
        return res.status(400).json({ error: 'Kamu sudah submit standby untuk tanggal ini' });
      return res.status(400).json({ error: error.message });
    }

    // Kirim ke grup WA
    const waResult = await wa.kirimStandby({
      namaClient:    req.user.nama,
      tanggal,
      jenisStandby,
      namaHariRaya,
      harga,
    });

    await supabase
      .from('standby')
      .update({ status_wa: waResult.success ? 'sent' : 'failed' })
      .eq('id', standby.id);

    await supabase.from('wa_log').insert({
      tipe_event: 'standby',
      ref_id:     standby.id,
      status:     waResult.success ? 'sent' : 'failed',
      error_msg:  waResult.error || null,
      sent_at:    new Date(),
    });

    res.json({ success: true, data: standby });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/standby/riwayat
router.get('/riwayat', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('standby')
    .select('*')
    .eq('user_id', req.user.id)
    .order('tanggal', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
