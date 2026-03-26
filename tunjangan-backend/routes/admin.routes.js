const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');
const auth     = require('../middleware/auth');

// Middleware: hanya admin
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Hanya admin yang bisa akses' });
  next();
}

// GET /api/admin/rekap?bulan=2026-01
// Mengembalikan semua data per client untuk bulan tersebut
router.get('/rekap', auth, adminOnly, async (req, res) => {
  try {
    const { bulan } = req.query; // format: "2026-01"
    if (!bulan) return res.status(400).json({ error: 'Parameter bulan wajib diisi (format: 2026-01)' });

    const awal  = `${bulan}-01`;
    const akhir = new Date(new Date(awal).getFullYear(), new Date(awal).getMonth() + 1, 0)
      .toISOString().split('T')[0]; // last day of month

    // Ambil semua client aktif
    const { data: clients } = await supabase
      .from('users')
      .select('id, nama')
      .eq('role', 'client')
      .eq('is_active', true)
      .order('nama');

    const rekap = [];

    for (const client of clients) {
      // Share lokasi bulan ini
      const { data: shareLokasi } = await supabase
        .from('share_lokasi')
        .select('*, rumah_sakit(nama_rs)')
        .eq('user_id', client.id)
        .gte('waktu_share', awal)
        .lte('waktu_share', akhir + 'T23:59:59Z')
        .order('waktu_share');

      // Lembur bulan ini (hanya submitted)
      const { data: lembur } = await supabase
        .from('lembur')
        .select('*, rumah_sakit(nama_rs)')
        .eq('user_id', client.id)
        .eq('status', 'submitted')
        .gte('waktu_foto', awal)
        .lte('waktu_foto', akhir + 'T23:59:59Z')
        .order('waktu_foto');

      // Standby bulan ini
      const { data: standby } = await supabase
        .from('standby')
        .select('*')
        .eq('user_id', client.id)
        .gte('tanggal', awal)
        .lte('tanggal', akhir)
        .order('tanggal');

      // Hitung total
      const totalShare   = (shareLokasi || []).reduce((s, r) => s + parseFloat(r.harga || 0), 0);
      const totalLembur  = (lembur || []).reduce((s, r) => s + parseFloat(r.total_harga || 0), 0);
      const totalStandby = (standby || []).reduce((s, r) => s + parseFloat(r.harga || 0), 0);

      rekap.push({
        client: { id: client.id, nama: client.nama },
        share_lokasi: shareLokasi || [],
        lembur:       lembur || [],
        standby:      standby || [],
        total: {
          share_lokasi: totalShare,
          lembur:       totalLembur,
          standby:      totalStandby,
          grand_total:  totalShare + totalLembur + totalStandby,
        }
      });
    }

    res.json({ bulan, rekap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users — daftar semua user
router.get('/users', auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nama, email, role, no_wa, is_active, created_at')
    .order('nama');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH /api/admin/users/:id — update user (aktif/nonaktif, dll)
router.patch('/users/:id', auth, adminOnly, async (req, res) => {
  const { is_active, nama, no_wa } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ is_active, nama, no_wa })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, data });
});

module.exports = router;
