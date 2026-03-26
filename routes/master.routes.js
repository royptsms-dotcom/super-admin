const express  = require('express');
const router   = express.Router();
const supabase = require('../lib/supabase');
const auth     = require('../middleware/auth');

// GET /api/master/rs
router.get('/rs', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('rumah_sakit')
    .select('id, kode_rs, nama_rs, harga_share_lokasi')
    .eq('is_active', true)
    .order('nama_rs');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/master/users
// Hanya tampilkan user dengan job yang SAMA dengan user yang login
// Jika user tidak punya job, tampilkan semua
router.get('/users', auth, async (req, res) => {
  try {
    // Ambil job user yang sedang login
    const { data: me } = await supabase
      .from('users').select('job').eq('id', req.user.id).single();

    let query = supabase
      .from('users')
      .select('id, nama, no_wa, job')
      .eq('role', 'client')
      .eq('is_active', true)
      .neq('id', req.user.id)
      .order('nama');

    // Filter by job jika user punya job
    if (me?.job) {
      query = query.eq('job', me.job);
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/master/config
router.get('/config', auth, async (req, res) => {
  const { data, error } = await supabase.from('config').select('key, value');
  if (error) return res.status(400).json({ error: error.message });
  const result = {};
  data.forEach(row => { result[row.key] = row.value; });
  res.json(result);
});

// GET /api/master/jobs — daftar semua job (untuk dropdown di admin)
router.get('/jobs', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('users').select('job').not('job', 'is', null).eq('is_active', true);
  if (error) return res.status(400).json({ error: error.message });
  const jobs = [...new Set(data.map(u => u.job).filter(Boolean))].sort();
  res.json(jobs);
});

module.exports = router;