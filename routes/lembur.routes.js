const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const supabase   = require('../lib/supabase');
const auth       = require('../middleware/auth');
const wa         = require('../services/whatsapp.service');

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

async function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => err ? reject(err) : resolve(result)
    ).end(buffer);
  });
}

// ─── AMBIL CONFIG LEMBUR ──────────────────────────────────────────────────────
async function ambilConfigLembur() {
  const { data } = await supabase
    .from('config')
    .select('key, value')
    .in('key', [
      'tarif_lembur_per_jam',
      'max_lembur',
      'batas_jam_lembur_besok',
      'jam_mulai_lembur_seninjum',
      'jam_mulai_lembur_sabtu',
    ]);

  const cfg = {};
  (data || []).forEach(r => { cfg[r.key] = parseFloat(r.value) || 0; });

  return {
    tarifPerJam:      cfg.tarif_lembur_per_jam       || 20000,
    maxLembur:        cfg.max_lembur                 || 50000,
    batasJamBesok:    cfg.batas_jam_lembur_besok     || 7,
    jamMulaiSeninjum: cfg.jam_mulai_lembur_seninjum  || 18,
    jamMulaiSabtu:    cfg.jam_mulai_lembur_sabtu     || 15,
  };
}

// ─── TENTUKAN TANGGAL LEMBUR ──────────────────────────────────────────────────
// Foto jam 00.00 - batasJamBesok → dihitung sebagai lembur hari sebelumnya
function tentikanTanggalLembur(waktuFoto, batasJamBesok) {
  const wib    = new Date(new Date(waktuFoto).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const jamWib = wib.getHours();

  if (jamWib < batasJamBesok) {
    const hariSebelumnya = new Date(wib);
    hariSebelumnya.setDate(hariSebelumnya.getDate() - 1);
    return hariSebelumnya.toISOString().split('T')[0];
  }
  return wib.toISOString().split('T')[0];
}

// ─── HITUNG LEMBUR DARI WAKTU FOTO ───────────────────────────────────────────
// waktu_selesai = waktu_foto (kapan client jepret)
// waktu_mulai   = otomatis jam batas hari itu (18.00 atau 15.00)
// Durasi = waktu_foto - jam_batas_hari_itu
function hitungHargaLembur(waktuFoto, config) {
  const { tarifPerJam, maxLembur, jamMulaiSeninjum, jamMulaiSabtu, batasJamBesok } = config;

  // Konversi waktu foto ke WIB
  const foto    = new Date(waktuFoto);
  const fotoWIB = new Date(foto.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

  // Tentukan hari berdasarkan tanggal lembur (bukan hari foto jika lewat tengah malam)
  let hariWIB = fotoWIB;
  if (fotoWIB.getHours() < batasJamBesok) {
    // Foto subuh → dihitung hari sebelumnya
    hariWIB = new Date(fotoWIB);
    hariWIB.setDate(hariWIB.getDate() - 1);
  }
  const hari = hariWIB.getDay(); // 0=Minggu,...,6=Sabtu

  // Minggu tidak ada lembur
  if (hari === 0) {
    return { durasiMenit: 0, durasiJam: 0, totalHarga: 0, infoHarga: 'Minggu tidak ada lembur', waktuMulai: null, waktuSelesai: waktuFoto };
  }

  // Tentukan jam mulai lembur sesuai hari
  let jamMulai;
  if (hari >= 1 && hari <= 5) {
    jamMulai = jamMulaiSeninjum; // Senin-Jumat
  } else {
    jamMulai = jamMulaiSabtu;    // Sabtu
  }

  // Buat waktu mulai lembur = hari lembur jam jamMulai WIB
  const mulaiWIB = new Date(hariWIB);
  mulaiWIB.setHours(jamMulai, 0, 0, 0);

  // Konversi ke UTC untuk hitung selisih
  const offsetMs  = foto.getTime() - fotoWIB.getTime();
  const mulaiUTC  = new Date(mulaiWIB.getTime() + offsetMs);
  const selesaiUTC = foto; // waktu foto = waktu selesai

  const durasiMs = selesaiUTC - mulaiUTC;

  if (durasiMs <= 0) {
    const namaHari = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][hari];
    return {
      durasiMenit: 0, durasiJam: 0, totalHarga: 0,
      infoHarga: `${namaHari}: foto diambil sebelum jam ${String(jamMulai).padStart(2,'0')}.00, belum ada lembur`,
      waktuMulai: mulaiUTC.toISOString(),
      waktuSelesai: selesaiUTC.toISOString(),
    };
  }

  const durasiMenit   = Math.floor(durasiMs / (1000 * 60));
  const durasiJam     = durasiMenit / 60;
  const tarifPerMenit = tarifPerJam / 60;
  const totalHarga    = Math.min(Math.round(durasiMenit * tarifPerMenit), maxLembur);

  const namaHari  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][hari];
  const jam       = Math.floor(durasiMenit / 60);
  const menit     = durasiMenit % 60;
  const durasiStr = menit > 0 ? `${jam} jam ${menit} menit` : `${jam} jam`;

  return {
    durasiMenit,
    durasiJam:   Math.round(durasiJam * 100) / 100,
    totalHarga,
    infoHarga:   `${namaHari}, lembur ${durasiStr} (${String(jamMulai).padStart(2,'0')}.00 → foto), Rp${tarifPerJam.toLocaleString('id-ID')}/jam`,
    waktuMulai:  mulaiUTC.toISOString(),
    waktuSelesai: selesaiUTC.toISOString(),
  };
}

// POST /api/lembur/foto
router.post('/foto', auth, upload.single('foto'), async (req, res) => {
  try {
    const { rs_id, latitude, longitude, waktu_foto } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Foto wajib diupload' });

    const result         = await uploadToCloudinary(req.file.buffer, 'tunjangan-app/lembur');
    const waktuFotoFinal = waktu_foto ? new Date(waktu_foto) : new Date();

    const { data: lembur, error } = await supabase
      .from('lembur')
      .insert({
        user_id:        req.user.id,
        rs_id,
        foto_url:       result.secure_url,
        waktu_foto:     waktuFotoFinal,
        foto_latitude:  latitude,
        foto_longitude: longitude,
        status:         'draft',
      })
      .select().single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, lembur_id: lembur.id, foto_url: lembur.foto_url, waktu_foto: lembur.waktu_foto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lembur/submit
router.post('/submit', auth, async (req, res) => {
  try {
    const { lembur_id, keterangan, tagged_user_ids } = req.body;

    if (!keterangan || keterangan.trim() === '')
      return res.status(400).json({ error: 'Keterangan wajib diisi sebelum submit' });

    const { data: lembur, error: fetchErr } = await supabase
      .from('lembur').select('*, rumah_sakit(nama_rs)')
      .eq('id', lembur_id).eq('user_id', req.user.id).eq('status', 'draft').single();

    if (fetchErr || !lembur)
      return res.status(404).json({ error: 'Data lembur draft tidak ditemukan' });

    const config        = await ambilConfigLembur();
    const tanggalLembur = tentikanTanggalLembur(lembur.waktu_foto, config.batasJamBesok);

    // Hitung otomatis dari waktu_foto
    const { durasiMenit, durasiJam, totalHarga, infoHarga, waktuMulai, waktuSelesai } =
      hitungHargaLembur(lembur.waktu_foto, config);

    const { error: updateErr } = await supabase
      .from('lembur')
      .update({
        waktu_mulai:    waktuMulai,
        waktu_selesai:  waktuSelesai,
        durasi_jam:     durasiJam,
        keterangan,
        total_harga:    totalHarga,
        tanggal_lembur: tanggalLembur,
        status:         'submitted',
      })
      .eq('id', lembur_id);

    if (updateErr) return res.status(400).json({ error: updateErr.message });

    let taggedNama = [];
    if (tagged_user_ids && tagged_user_ids.length > 0) {
      await supabase.from('tag_lembur').insert(
        tagged_user_ids.map(uid => ({ lembur_id, tagged_user_id: uid }))
      );
      const { data: tagUsers } = await supabase.from('users').select('nama').in('id', tagged_user_ids);
      taggedNama = tagUsers.map(u => u.nama);
    }

    const groupId = await wa.getWaGroupIdByUserId(req.user.id);

    const waResult = await wa.kirimLembur({
      namaClient:   req.user.nama,
      namaRS:       lembur.rumah_sakit.nama_rs,
      fotoUrl:      lembur.foto_url,
      waktuFoto:    lembur.waktu_foto,
      durasiMenit,
      durasiJam,
      totalHarga,
      keterangan,
      infoHarga,
      taggedUsers:  taggedNama,
      tanggalLembur,
    }, groupId);

    await supabase.from('lembur').update({ status_wa: waResult.success ? 'sent' : 'failed' }).eq('id', lembur_id);
    await supabase.from('wa_log').insert({
      tipe_event: 'lembur', ref_id: lembur_id,
      status:     waResult.success ? 'sent' : 'failed',
      error_msg:  waResult.error || null, sent_at: new Date(),
    });

    res.json({
      success: true,
      durasi_menit:   durasiMenit,
      durasi_jam:     durasiJam,
      total_harga:    totalHarga,
      info_harga:     infoHarga,
      tanggal_lembur: tanggalLembur,
      waktu_mulai:    waktuMulai,
      waktu_selesai:  waktuSelesai,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lembur/preview — preview harga sebelum submit
router.get('/preview/:lembur_id', auth, async (req, res) => {
  try {
    const { data: lembur } = await supabase
      .from('lembur').select('waktu_foto')
      .eq('id', req.params.lembur_id).eq('user_id', req.user.id).single();
    if (!lembur) return res.status(404).json({ error: 'Draft tidak ditemukan' });

    const config  = await ambilConfigLembur();
    const hasil   = hitungHargaLembur(lembur.waktu_foto, config);
    const tanggal = tentikanTanggalLembur(lembur.waktu_foto, config.batasJamBesok);
    res.json({ ...hasil, tanggal_lembur: tanggal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lembur/draft
router.get('/draft', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('lembur')
    .select('id, foto_url, waktu_foto, rumah_sakit(nama_rs), created_at')
    .eq('user_id', req.user.id).eq('status', 'draft')
    .order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/lembur/draft/:id
router.delete('/draft/:id', auth, async (req, res) => {
  const { error } = await supabase
    .from('lembur').delete()
    .eq('id', req.params.id).eq('user_id', req.user.id).eq('status', 'draft');
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// GET /api/lembur/riwayat
router.get('/riwayat', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('lembur')
    .select('*, rumah_sakit(nama_rs)')
    .eq('user_id', req.user.id).eq('status', 'submitted')
    .order('waktu_foto', { ascending: false }).limit(50);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

module.exports = router;