const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');
const auth     = require('../middleware/auth');

// GET /api/master/rs — daftar RS aktif (untuk dropdown di app)
router.get('/rs', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('rumah_sakit')
    .select('id, kode_rs, nama_rs, harga_share_lokasi, harga_lembur_per_jam')
    .eq('is_active', true)
    .order('nama_rs');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/master/users — daftar user client aktif (untuk fitur tag @nama)
router.get('/users', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nama, no_wa')
    .eq('role', 'client')
    .eq('is_active', true)
    .neq('id', req.user.id) // exclude diri sendiri
    .order('nama');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/master/config — ambil config app
router.get('/config', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('config')
    .select('key, value');

  if (error) return res.status(400).json({ error: error.message });

  // Ubah jadi object { key: value }
  const result = {};
  data.forEach(row => { result[row.key] = row.value; });
  res.json(result);
});

module.exports = router;
