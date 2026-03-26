const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const auth    = require('../middleware/auth');

// POST /api/auth/login
// Body: { email, password }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email dan password wajib diisi' });

    // Cari user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !user)
      return res.status(401).json({ error: 'Email atau password salah' });

    // Cek password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Email atau password salah' });

    // Buat JWT token (berlaku 30 hari)
    const token = jwt.sign(
      { id: user.id, nama: user.nama, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id:    user.id,
        nama:  user.nama,
        email: user.email,
        role:  user.role,
        no_wa: user.no_wa,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — ambil data user yang sedang login
router.get('/me', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nama, email, role, no_wa')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ error: 'User tidak ditemukan' });
  res.json(data);
});

// POST /api/auth/register (hanya admin yang bisa tambah user baru)
router.post('/register', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'Hanya admin yang bisa tambah user' });

    const { nama, email, password, role, no_wa } = req.body;
    const hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert({ nama, email: email.toLowerCase(), password_hash: hash, role: role || 'client', no_wa })
      .select('id, nama, email, role')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
