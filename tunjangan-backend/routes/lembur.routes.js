const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const supabase   = require('../lib/supabase');
const auth       = require('../middleware/auth');
const wa         = require('../services/whatsapp.service');

// Setup Cloudinary
cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

// Upload ke memory dulu, lalu stream ke Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

async function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result)
    ).end(buffer);
  });
}

// ─── POST /api/lembur/foto ────────────────────────────────────────────────────
// Langkah 1: client ambil foto → simpan sebagai draft
// Form-data: foto (file), rs_id, latitude, longitude
router.post('/foto', auth, upload.single('foto'), async (req, res) => {
  try {
    const { rs_id, latitude, longitude } = req.body;

    if (!req.file)
      return res.status(400).json({ error: 'Foto wajib diupload' });

    // Upload foto ke Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'tunjangan-app/lembur'
    );

    // Ambil harga RS
    const { data: rs } = await supabase
      .from('rumah_sakit')
      .select('harga_lembur_per_jam')
      .eq('id', rs_id)
      .single();

    // Simpan sebagai draft
    const { data: lembur, error } = await supabase
      .from('lembur')
      .insert({
        user_id:       req.user.id,
        rs_id,
        foto_url:      result.secure_url,
        waktu_foto:    new Date(),
        foto_latitude: latitude,
        foto_longitude: longitude,
        harga_per_jam: rs?.harga_lembur_per_jam || 0,
        status:        'draft',
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      success: true,
      lembur_id: lembur.id,
      foto_url:  lembur.foto_url,
      waktu_foto: lembur.waktu_foto,
      message:   'Foto tersimpan. Isi keterangan kapan saja sebelum submit.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/lembur/submit ─────────────────────────────────────────────────
// Langkah 2: isi keterangan + submit → kirim ke WA
// Body: { lembur_id, rs_id, waktu_mulai, waktu_selesai, keterangan, tagged_user_ids? }
router.post('/submit', auth, async (req, res) => {
  try {
    const { lembur_id, waktu_mulai, waktu_selesai, keterangan, tagged_user_ids } = req.body;

    if (!keterangan || keterangan.trim() === '')
      return res.status(400).json({ error: 'Keterangan wajib diisi sebelum submit' });

    // Ambil data lembur draft milik user ini
    const { data: lembur, error: fetchErr } = await supabase
      .from('lembur')
      .select('*, rumah_sakit(nama_rs, harga_lembur_per_jam)')
      .eq('id', lembur_id)
      .eq('user_id', req.user.id)
      .eq('status', 'draft')
      .single();

    if (fetchErr || !lembur)
      return res.status(404).json({ error: 'Data lembur draft tidak ditemukan' });

    // Hitung durasi dan total harga
    const durasiMs  = new Date(waktu_selesai) - new Date(waktu_mulai);
    const durasiJam = Math.round((durasiMs / (1000 * 60 * 60)) * 10) / 10;
    const totalHarga = durasiJam * lembur.rumah_sakit.harga_lembur_per_jam;

    // Update record menjadi submitted
    const { error: updateErr } = await supabase
      .from('lembur')
      .update({
        waktu_mulai,
        waktu_selesai,
        durasi_jam:  durasiJam,
        keterangan,
        total_harga: totalHarga,
        status:      'submitted',
      })
      .eq('id', lembur_id);

    if (updateErr) return res.status(400).json({ error: updateErr.message });

    // Simpan tag jika ada
    let taggedNama = [];
    if (tagged_user_ids && tagged_user_ids.length > 0) {
      const tags = tagged_user_ids.map(uid => ({
        lembur_id,
        tagged_user_id: uid,
      }));
      await supabase.from('tag_lembur').insert(tags);

      const { data: tagUsers } = await supabase
        .from('users')
        .select('nama')
        .in('id', tagged_user_ids);
      taggedNama = tagUsers.map(u => u.nama);
    }

    // Kirim foto + caption ke grup WA
    const waResult = await wa.kirimLembur({
      namaClient:   req.user.nama,
      namaRS:       lembur.rumah_sakit.nama_rs,
      fotoUrl:      lembur.foto_url,
      waktuFoto:    lembur.waktu_foto,
      waktuMulai:   waktu_mulai,
      waktuSelesai: waktu_selesai,
      durasiJam,
      totalHarga,
      keterangan,
      taggedUsers:  taggedNama,
    });

    // Update status WA
    await supabase
      .from('lembur')
      .update({ status_wa: waResult.success ? 'sent' : 'failed' })
      .eq('id', lembur_id);

    await supabase.from('wa_log').insert({
      tipe_event: 'lembur',
      ref_id:     lembur_id,
      status:     waResult.success ? 'sent' : 'failed',
      error_msg:  waResult.error || null,
      sent_at:    new Date(),
    });

    res.json({ success: true, durasi_jam: durasiJam, total_harga: totalHarga });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lembur/draft — ambil semua draft milik user (belum diisi keterangan)
router.get('/draft', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('lembur')
    .select('id, foto_url, waktu_foto, rumah_sakit(nama_rs), created_at')
    .eq('user_id', req.user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/lembur/riwayat — riwayat lembur submitted
router.get('/riwayat', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('lembur')
    .select('*, rumah_sakit(nama_rs)')
    .eq('user_id', req.user.id)
    .eq('status', 'submitted')
    .order('waktu_foto', { ascending: false })
    .limit(50);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;
