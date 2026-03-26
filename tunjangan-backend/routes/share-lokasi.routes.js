const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');
const auth     = require('../middleware/auth');
const wa       = require('../services/whatsapp.service');

// POST /api/share-lokasi
// Body: { rs_id, latitude, longitude, keterangan?, tagged_user_ids? }
router.post('/', auth, async (req, res) => {
  try {
    const { rs_id, latitude, longitude, keterangan, tagged_user_ids } = req.body;

    // Ambil data RS untuk nama dan harga
    const { data: rs, error: rsErr } = await supabase
      .from('rumah_sakit')
      .select('nama_rs, harga_share_lokasi')
      .eq('id', rs_id)
      .eq('is_active', true)
      .single();

    if (rsErr || !rs)
      return res.status(404).json({ error: 'RS tidak ditemukan' });

    // Simpan share lokasi
    const { data: share, error } = await supabase
      .from('share_lokasi')
      .insert({
        user_id:    req.user.id,
        rs_id,
        latitude,
        longitude,
        keterangan,
        harga:      rs.harga_share_lokasi,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // Simpan tag jika ada
    let taggedNama = [];
    if (tagged_user_ids && tagged_user_ids.length > 0) {
      const tags = tagged_user_ids.map(uid => ({
        share_lokasi_id: share.id,
        tagged_user_id:  uid,
      }));
      await supabase.from('tag_share_lokasi').insert(tags);

      // Ambil nama user yang ditag untuk pesan WA
      const { data: tagUsers } = await supabase
        .from('users')
        .select('nama')
        .in('id', tagged_user_ids);
      taggedNama = tagUsers.map(u => u.nama);
    }

    // Kirim ke grup WA
    const waResult = await wa.kirimShareLokasi({
      namaClient:  req.user.nama,
      namaRS:      rs.nama_rs,
      latitude,
      longitude,
      hargaRS:     rs.harga_share_lokasi,
      keterangan,
      taggedUsers: taggedNama,
    });

    // Update status WA
    await supabase
      .from('share_lokasi')
      .update({ status_wa: waResult.success ? 'sent' : 'failed' })
      .eq('id', share.id);

    // Catat di wa_log
    await supabase.from('wa_log').insert({
      tipe_event: 'share_lokasi',
      ref_id:     share.id,
      status:     waResult.success ? 'sent' : 'failed',
      error_msg:  waResult.error || null,
      sent_at:    new Date(),
    });

    res.json({ success: true, data: share });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/share-lokasi/riwayat — riwayat share lokasi user sendiri
router.get('/riwayat', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('share_lokasi')
    .select('*, rumah_sakit(nama_rs)')
    .eq('user_id', req.user.id)
    .order('waktu_share', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
